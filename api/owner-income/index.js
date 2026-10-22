// GET /api/owner/clients/{clientId}/income  (owner only)
// Reads the client's latest T4, Notice of Assessment and pay stub PDFs and suggests an annual income.
// The suggestion is never applied automatically: Maria reviews it and clicks "Use".
const c = require("../shared/core");
const { pdfText, extractIncome } = require("../shared/income");
const PRIORITY = { T4: 1, "Notice of Assessment": 2, "Pay stub": 3 };

module.exports = async function (context, req) {
  const p = c.getPrincipal(req);
  if (!p) return (context.res = c.unauthorized());
  if (!c.isOwner(p)) return (context.res = c.forbidden());
  const clientId = c.safeKey(context.bindingData.clientId || "");

  const docs = (await c.listDocs(clientId))
    .filter((d) => ["t4", "noa", "paystub"].includes(d.docType) && !d.demo && d.blobName)
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
  const latest = {};
  for (const d of docs) if (!latest[d.docType]) latest[d.docType] = d;

  const suggestions = [];
  const notes = [];
  for (const d of Object.values(latest)) {
    if (!/pdf/i.test(d.contentType || "") && !/\.pdf$/i.test(d.blobName)) {
      notes.push(`${d.fileName}: image file, cannot read text yet (enter manually)`);
      continue;
    }
    try {
      const buf = await c.container().getBlockBlobClient(d.blobName).downloadToBuffer();
      const text = await pdfText(buf);
      const r = extractIncome(text, d.docType);
      if (r && r.annual) suggestions.push({ source: r.kind, docId: d.rowKey, fileName: d.fileName, annual: r.annual, detail: r.detail });
      else notes.push(`${d.fileName}: ${r ? r.detail : "no income figure found"} (enter manually)`);
    } catch (e) {
      notes.push(`${d.fileName}: could not read this PDF (it may be a scan); enter manually`);
    }
  }
  suggestions.sort((a, b) => PRIORITY[a.source] - PRIORITY[b.source]);
  await c.audit(p, "income-read", clientId);
  context.res = c.json(200, { recommended: suggestions[0] || null, suggestions, notes, checked: Object.keys(latest).length });
};
