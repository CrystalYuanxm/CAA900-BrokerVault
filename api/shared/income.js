// Reads income figures from text-based PDFs (T4, Notice of Assessment, pay stub).
// Scanned images are not supported here; Azure Document Intelligence is the planned upgrade.
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

const money = (s) => Number(String(s).replace(/[$,\s]/g, ""));
const AMOUNT = "\\$?\\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]{2})?|[0-9]+(?:\\.[0-9]{2})?)";

// First amount that follows one of the labels on the same line
function find(text, labels) {
  for (const label of labels) {
    const m = text.match(new RegExp(`${label}[^0-9$\\n]{0,40}${AMOUNT}`, "i"));
    if (m) return money(m[1]);
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

module.exports = { pdfText, extractIncome, payFrequency };
