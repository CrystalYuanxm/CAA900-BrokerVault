// Reads income figures from text-based PDFs (T4, Notice of Assessment, pay stub).
// Scans and phone photos go through Azure AI Document Intelligence (docIntelText) when it is configured.
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

async function pdfText(buffer, maxPages = 3) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), disableFontFace: true, isEvalSupported: false, verbosity: 0 }).promise;
  let out = "";
  for (let i = 1; i <= Math.min(doc.numPages, maxPages); i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    let lastY = null;
    for (const it of tc.items) {
      const y = it.transform[5];
      out += lastY === null ? "" : Math.abs(y - lastY) > 2 ? "\n" : " ";
      out += it.str;
      lastY = y;
    }
    out += "\n";
  }
  await doc.destroy();
  return out;
}

// Azure AI Document Intelligence (prebuilt-read): OCR for scans and phone photos (JPG, PNG, image-only PDFs).
// Used only when DOCINTEL_ENDPOINT and DOCINTEL_KEY are set. The free tier (F0) reads the first 2 pages, max 4 MB.
const DOCINTEL_API = "2024-11-30";
const DOCINTEL_MAX_BYTES = 4 * 1024 * 1024;
const docIntelEnabled = () => !!(process.env.DOCINTEL_ENDPOINT && process.env.DOCINTEL_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function docIntelText(buffer, { timeoutMs = 25000 } = {}) {
  if (!docIntelEnabled()) throw new Error("Document Intelligence is not configured");
  if (buffer.length > DOCINTEL_MAX_BYTES) throw new Error("File is larger than 4 MB, the free tier limit");
  let endpoint = process.env.DOCINTEL_ENDPOINT;
  while (endpoint.endsWith("/")) endpoint = endpoint.slice(0, -1);
  const headers = { "Ocp-Apim-Subscription-Key": process.env.DOCINTEL_KEY, "Content-Type": "application/json" };
  const start = await fetch(`${endpoint}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=${DOCINTEL_API}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ base64Source: buffer.toString("base64") }),
  });
  if (start.status !== 202) throw new Error(`Document Intelligence returned ${start.status}`);
  const opUrl = start.headers.get("operation-location");
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(1000);
    const res = await fetch(opUrl, { headers });
    const body = await res.json();
    if (body.status === "succeeded") return (body.analyzeResult && body.analyzeResult.content) || "";
    if (body.status === "failed") throw new Error("Document Intelligence could not read this file");
  }
  throw new Error("Document Intelligence timed out");
}

const money = (s) => Number(String(s).replace(/[$,\s]/g, ""));
// An amount: optional "$" and one space, digits with optional thousands commas, optional cents.
// Written so that no part can match the same characters two ways (linear time, no backtracking).
const AMOUNT = "\\$?[ \\t]?(\\d[\\d,]*(?:\\.\\d\\d)?)";

// First amount that follows one of the labels: same line first, then the next lines
// (OCR of scans often puts the box number and the value on the lines below the label).
// Box numbers such as "14" are skipped: an amount must have a $, a comma, cents, or be 100 or more.
const looksLikeMoney = (raw) => /[$,.]/.test(raw) || money(raw) >= 100;
function find(text, labels) {
  for (const window of [/^[^\n]{0,60}/, /^[\s\S]{0,80}/]) {
    for (const label of labels) {
      const re = new RegExp(label, "ig");
      let m;
      while ((m = re.exec(text))) {
        const after = text.slice(m.index + m[0].length).match(window)[0];
        const amounts = [...after.matchAll(new RegExp(AMOUNT, "g"))].map((a) => a[0].trim()).filter(looksLikeMoney);
        // Prefer a formatted amount ($, comma or cents) over a bare number such as a line or box number
        const formatted = amounts.find((a) => /[$,.]/.test(a));
        if (formatted || amounts.length) return money(formatted || amounts[0]);
      }
    }
  }
  return null;
}

const FREQ = [
  { re: /bi-?weekly|every two weeks|every 2 weeks/i, n: 26, label: "bi-weekly" },
  { re: /semi-?monthly|twice a month/i, n: 24, label: "semi-monthly" },
  { re: /\bweekly\b/i, n: 52, label: "weekly" },
  { re: /\bmonthly\b/i, n: 12, label: "monthly" },
];

function payFrequency(text) {
  for (const f of FREQ) if (f.re.test(text)) return f;
  // Infer from "Pay period: Sep 1 - Sep 15" style dates
  const m = text.match(/pay period[^\n]*?([A-Za-z]{3,9})\.?\s+(\d{1,2})\s*(?:-|–|to)\s*(?:([A-Za-z]{3,9})\.?\s+)?(\d{1,2})/i);
  if (m) {
    const start = Number(m[2]);
    const end = Number(m[4]);
    const days = end - start;
    if ((start === 1 && end === 15) || (start === 16 && end >= 28)) return { n: 24, label: "semi-monthly (from pay period dates)" };
    if (days === 13) return { n: 26, label: "bi-weekly (from pay period dates)" };
    if (days === 6) return { n: 52, label: "weekly (from pay period dates)" };
  }
  return null;
}

// Returns {kind, annual, detail} or null
function extractIncome(text, docType) {
  const t = text.replace(/ /g, " ");
  if (docType === "t4" || /\bT4\b/.test(t)) {
    const v = find(t, ["Employment income", "Box\\s*14"]);
    if (v) return { kind: "T4", annual: v, detail: "T4 box 14, employment income" };
  }
  if (docType === "noa" || /notice of assessment/i.test(t)) {
    const v = find(t, ["Total income", "Line\\s*15000"]);
    if (v) return { kind: "Notice of Assessment", annual: v, detail: "NOA line 15000, total income" };
  }
  if (docType === "paystub" || /pay\s*stub|gross pay|earnings statement/i.test(t)) {
    const gross = find(t, ["Gross pay", "Gross earnings", "Total gross"]);
    const f = payFrequency(t);
    if (gross && f) return { kind: "Pay stub", annual: Math.round(gross * f.n), detail: `$${gross.toLocaleString("en-CA")} gross × ${f.n} (${f.label})` };
    if (gross) return { kind: "Pay stub", annual: null, detail: `$${gross.toLocaleString("en-CA")} gross per period, but the pay frequency was not found` };
  }
  return null;
}

module.exports = { pdfText, extractIncome, payFrequency, docIntelText, docIntelEnabled };
