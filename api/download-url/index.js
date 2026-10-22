// GET /api/download-url?doc=<docId>[&client=<clientId>]
// Read-only SAS, 5 minutes. Allowed for the owner, or for the client who owns the document. Every download is audited.
const c = require("../shared/core");
module.exports = async function (context, req) {
  const p = c.getPrincipal(req);
  if (!p) return (context.res = c.unauthorized());
  const docId = req.query.doc;
  const clientId = c.isOwner(p) && req.query.client ? req.query.client : p.userId;
  if (!docId) return (context.res = c.bad("doc is required"));

  let doc;
  try {
    doc = await c.table("Documents").getEntity(c.safeKey(clientId), docId);
  } catch {
    return (context.res = c.json(404, { error: "Document not found" }));
  }
  if (!c.isOwner(p) && doc.partitionKey !== c.safeKey(p.userId)) return (context.res = c.forbidden());
  if (doc.demo) return (context.res = c.bad("Demo record: no file is stored for sample clients"));

  const { url, expiresOn } = c.blobSasUrl(doc.blobName, "r", {
    contentDisposition: `attachment; filename="${String(doc.fileName).replace(/"/g, "")}"`,
  });
  await c.audit(p, "download", doc.blobName);
  context.res = c.json(200, { url, expiresOn });
};
