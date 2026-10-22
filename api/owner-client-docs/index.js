// GET /api/owner/clients/{clientId}/documents : one client's checklist and documents (owner only)
const c = require("../shared/core");
module.exports = async function (context, req) {
  const p = c.getPrincipal(req);
  if (!p) return (context.res = c.unauthorized());
  if (!c.isOwner(p)) return (context.res = c.forbidden());
  const clientId = c.safeKey(context.bindingData.clientId || "");
  let client = null;
  try {
    client = await c.table("Clients").getEntity("client", clientId);
  } catch {
    return (context.res = c.json(404, { error: "Client not found" }));
  }
  const docs = await c.listDocs(clientId);
  await c.audit(p, "view-client", clientId);
  context.res = c.json(200, {
    client: { clientId, name: client.name, createdAt: client.createdAt, demo: !!client.demo },
    checklist: c.checklistFor(docs),
    documents: docs
      .map((d) => ({ docId: d.rowKey, docType: d.docType, fileName: d.fileName, size: d.size, uploadedAt: d.uploadedAt, demo: !!d.demo }))
      .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1)),
  });
};
