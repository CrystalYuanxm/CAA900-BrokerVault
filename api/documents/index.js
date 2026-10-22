// POST /api/documents {blobName, docType, fileName}
// Records an uploaded document after checking the blob exists and belongs to the caller.
const crypto = require("crypto");
const c = require("../shared/core");
module.exports = async function (context, req) {
  const p = c.getPrincipal(req);
  if (!p) return (context.res = c.unauthorized());
  const { blobName, docType, fileName } = req.body || {};
  const prefix = `${c.safeKey(p.userId)}/`;
  if (!blobName || !String(blobName).startsWith(prefix)) return (context.res = c.forbidden());
  if (!c.DOC_TYPES.some((t) => t.key === docType)) return (context.res = c.bad("Unknown document type"));

  let props;
  try {
    props = await c.container().getBlockBlobClient(blobName).getProperties();
  } catch {
    return (context.res = c.bad("Upload not found. Please upload the file again."));
  }
  await c.upsertClient(p);
  const doc = {
    partitionKey: c.safeKey(p.userId),
    rowKey: crypto.randomUUID(),
    docType,
    fileName: String(fileName || "document").slice(0, 200),
    blobName,
    size: props.contentLength,
    contentType: props.contentType || "",
    uploadedAt: new Date().toISOString(),
    status: "received",
  };
  await c.table("Documents").createEntity(doc);
  await c.audit(p, "document-recorded", blobName);
  context.res = c.json(201, { docId: doc.rowKey, docType, fileName: doc.fileName, uploadedAt: doc.uploadedAt });
};
