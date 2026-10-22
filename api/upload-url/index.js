// POST /api/upload-url {docType, fileName, size}
// Returns a write-only SAS URL for ONE new blob under the caller's own prefix, valid 5 minutes.
const crypto = require("crypto");
const path = require("path");
const c = require("../shared/core");
module.exports = async function (context, req) {
  const p = c.getPrincipal(req);
  if (!p) return (context.res = c.unauthorized());
  const { docType, fileName, size } = req.body || {};
  if (!c.DOC_TYPES.some((t) => t.key === docType)) return (context.res = c.bad("Unknown document type"));
  const ext = path.extname(String(fileName || "")).toLowerCase();
  if (!c.ALLOWED_EXT[ext]) return (context.res = c.bad("Only PDF, JPG or PNG files are accepted"));
  if (!(Number(size) > 0) || Number(size) > c.MAX_BYTES) return (context.res = c.bad("File must be between 1 byte and 10 MB"));

  // Unguessable blob name, prefixed by the client's id; the original file name is kept only in the database
  const blobName = `${c.safeKey(p.userId)}/${docType}/${crypto.randomUUID()}${ext}`;
  const { url, expiresOn } = c.blobSasUrl(blobName, "cw", { contentType: c.ALLOWED_EXT[ext] });
  await c.audit(p, "upload-url", blobName);
  context.res = c.json(200, { uploadUrl: url, blobName, contentType: c.ALLOWED_EXT[ext], expiresOn });
};
