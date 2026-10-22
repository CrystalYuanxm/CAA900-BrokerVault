// POST /api/documents {blobName, docType, fileName}
// Records an uploaded document after checking that the blob belongs to the caller and that the file
// really is what it claims to be (size limit + "magic bytes" of PDF / JPEG / PNG). Bad files are deleted.
const crypto = require("crypto");
const c = require("../shared/core");

// First bytes of each allowed format
const SIGNATURES = [
  { type: "application/pdf", ext: [".pdf"], bytes: [0x25, 0x50, 0x44, 0x46] },          // %PDF
  { type: "image/jpeg", ext: [".jpg", ".jpeg"], bytes: [0xff, 0xd8, 0xff] },              // JPEG
  { type: "image/png", ext: [".png"], bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // PNG
];
const detect = (buf) => SIGNATURES.find((s) => s.bytes.every((b, i) => buf[i] === b));

module.exports = async function (context, req) {
  const p = c.getPrincipal(req);
  if (!p) return (context.res = c.unauthorized());
  const { blobName, docType, fileName } = req.body || {};
  const prefix = `${c.safeKey(p.userId)}/`;
  if (!blobName || !String(blobName).startsWith(prefix)) return (context.res = c.forbidden());
  if (!c.DOC_TYPES.some((t) => t.key === docType)) return (context.res = c.bad("Unknown document type"));

  const blob = c.container().getBlockBlobClient(blobName);
  let props;
  try {
    props = await blob.getProperties();
  } catch {
    return (context.res = c.bad("Upload not found. Please upload the file again."));
  }

  // 1. Real size (the client cannot fake this one)
  if (props.contentLength > c.MAX_BYTES || props.contentLength === 0) {
    await blob.deleteIfExists();
    await c.audit(p, "upload-rejected-size", blobName);
    return (context.res = c.bad("File must be between 1 byte and 10 MB."));
  }
  // 2. Real format from the first bytes, and it must match the extension
  const head = await blob.downloadToBuffer(0, Math.min(16, props.contentLength));
  const kind = detect(head);
  const ext = blobName.slice(blobName.lastIndexOf(".")).toLowerCase();
  if (!kind || !kind.ext.includes(ext)) {
    await blob.deleteIfExists();
    await c.audit(p, "upload-rejected-format", blobName);
    return (context.res = c.bad("This file is not a real PDF, JPG or PNG. It was removed. Please upload the original document."));
  }

  await c.upsertClient(p);
  const doc = {
    partitionKey: c.safeKey(p.userId),
    rowKey: crypto.randomUUID(),
    docType,
    fileName: String(fileName || "document").slice(0, 200),
    blobName,
    size: props.contentLength,
    contentType: kind.type,
    uploadedAt: new Date().toISOString(),
    status: "received",
  };
  await c.table("Documents").createEntity(doc);
  await c.audit(p, "document-recorded", blobName);
  context.res = c.json(201, { docId: doc.rowKey, docType, fileName: doc.fileName, uploadedAt: doc.uploadedAt });
};
