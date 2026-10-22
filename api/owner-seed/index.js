// POST /api/owner/seed : adds three FICTIONAL sample clients for demos (owner only). No files are stored for them.
const c = require("../shared/core");
const SAMPLES = [
  { id: "demo-jane-doe", name: "Jane Doe (sample)", docs: ["paystub", "t4", "noa", "bank", "id"] },
  { id: "demo-amir-haddad", name: "Amir & Lena Haddad (sample)", docs: ["paystub", "t4", "bank", "id", "employment"] },
  { id: "demo-wei-zhang", name: "Wei Zhang (sample)", docs: ["paystub", "id"] },
];
module.exports = async function (context, req) {
  const p = c.getPrincipal(req);
  if (!p) return (context.res = c.unauthorized());
  if (!c.isOwner(p)) return (context.res = c.forbidden());
  const now = Date.now();
  for (const s of SAMPLES) {
    await c.table("Clients").upsertEntity({ partitionKey: "client", rowKey: s.id, name: s.name, provider: "sample", demo: true, createdAt: new Date(now - 9 * 864e5).toISOString(), lastSeen: new Date(now).toISOString() }, "Replace");
    for (const [i, t] of s.docs.entries()) {
      await c.table("Documents").upsertEntity({
        partitionKey: s.id, rowKey: `${s.id}-${t}`, docType: t, fileName: `${t}-sample.pdf`, blobName: "", size: 0,
        contentType: "application/pdf", uploadedAt: new Date(now - (8 - i) * 864e5).toISOString(), status: "received", demo: true,
      }, "Replace");
    }
  }
  await c.audit(p, "seed-samples", "3 sample clients");
  context.res = c.json(200, { added: SAMPLES.length });
};
