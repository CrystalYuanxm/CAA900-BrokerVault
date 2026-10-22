// Shared helpers for the BrokerVault API: identity, storage clients, responses.
const crypto = require("crypto");
const { TableClient } = require("@azure/data-tables");
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} = require("@azure/storage-blob");

const CONTAINER = process.env.DOCS_CONTAINER || "client-documents";
const SAS_MINUTES = 5;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXT = { ".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

const DOC_TYPES = [
  { key: "paystub", label: "Recent pay stub" },
  { key: "t4", label: "T4 slips (last 2 years)" },
  { key: "noa", label: "Notice of Assessment" },
  { key: "bank", label: "Bank statements (90 days)" },
  { key: "id", label: "Government photo ID" },
  { key: "employment", label: "Employment letter" },
];

// ---------- identity (Static Web Apps passes the validated user in this header) ----------
function getPrincipal(req) {
  const header = req.headers["x-ms-client-principal"];
  if (!header) return null;
  try {
    const p = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    if (!p || !p.userId) return null;
    p.userRoles = p.userRoles || [];
    return p;
  } catch {
    return null;
  }
}
const isOwner = (p) => !!p && p.userRoles.includes("owner");

// ---------- responses ----------
const json = (status, body) => ({
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});
const unauthorized = () => json(401, { error: "Sign in required" });
const forbidden = () => json(403, { error: "Not allowed" });
const bad = (msg) => json(400, { error: msg });

// ---------- storage ----------
function conn() {
  const c = process.env.STORAGE_CONNECTION_STRING;
  if (!c) throw new Error("STORAGE_CONNECTION_STRING is not set");
  return c;
}
function parseConn(c) {
  const parts = Object.fromEntries(
    c.split(";").filter(Boolean).map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i), kv.slice(i + 1)];
    })
  );
  return parts;
}
const table = (name) => TableClient.fromConnectionString(conn(), name, { allowInsecureConnection: conn().includes("127.0.0.1") });
const blobService = () => BlobServiceClient.fromConnectionString(conn());
const container = () => blobService().getContainerClient(CONTAINER);

function credential() {
  const p = parseConn(conn());
  return new StorageSharedKeyCredential(p.AccountName, p.AccountKey);
}

// Short-lived SAS for one blob. perms: "cw" (upload) or "r" (download)
function blobSasUrl(blobName, perms, extra = {}) {
  const now = new Date();
  const sas = generateBlobSASQueryParameters(
    {
      containerName: CONTAINER,
      blobName,
      permissions: BlobSASPermissions.parse(perms),
      startsOn: new Date(now.getTime() - 60 * 1000),
      expiresOn: new Date(now.getTime() + SAS_MINUTES * 60 * 1000),
      protocol: conn().includes("127.0.0.1") ? SASProtocol.HttpsAndHttp : SASProtocol.Https,
      ...extra,
    },
    credential()
  ).toString();
  return { url: `${container().getBlockBlobClient(blobName).url}?${sas}`, expiresOn: new Date(now.getTime() + SAS_MINUTES * 60 * 1000).toISOString() };
}

// Table keys cannot contain / \ # ?
const safeKey = (s) => String(s).replace(/[\/\\#?]/g, "_");

async function audit(actor, action, target) {
  const now = new Date();
  try {
    await table("Audit").createEntity({
      partitionKey: now.toISOString().slice(0, 10),
      rowKey: `${now.getTime()}-${crypto.randomUUID()}`,
      actor: actor ? `${actor.userDetails} (${actor.userId})` : "anonymous",
      action,
      target: target || "",
    });
  } catch (e) {
    // auditing must never break the request, but it is logged
    console.error("audit failed", e.message);
  }
}

async function listDocs(clientId) {
  const out = [];
  const iter = table("Documents").listEntities({ queryOptions: { filter: `PartitionKey eq '${safeKey(clientId)}'` } });
  for await (const e of iter) out.push(e);
  return out;
}

function checklistFor(docs) {
  const items = DOC_TYPES.map((t) => {
    const mine = docs.filter((d) => d.docType === t.key).sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
    const latest = mine[0];
    return {
      key: t.key,
      label: t.label,
      status: latest ? "received" : "missing",
      count: mine.length,
      docId: latest ? latest.rowKey : null,
      fileName: latest ? latest.fileName : null,
      uploadedAt: latest ? latest.uploadedAt : null,
      demo: latest ? !!latest.demo : false,
    };
  });
  const received = items.filter((i) => i.status === "received").length;
  return { items, received, total: items.length };
}

async function upsertClient(p) {
  const t = table("Clients");
  const key = safeKey(p.userId);
  let existing = null;
  try {
    existing = await t.getEntity("client", key);
  } catch {}
  const now = new Date().toISOString();
  await t.upsertEntity(
    {
      partitionKey: "client",
      rowKey: key,
      name: p.userDetails || "Client",
      provider: p.identityProvider || "",
      createdAt: existing ? existing.createdAt : now,
      lastSeen: now,
    },
    "Merge"
  );
  return !existing;
}

module.exports = {
  DOC_TYPES, ALLOWED_EXT, MAX_BYTES, SAS_MINUTES, CONTAINER,
  getPrincipal, isOwner, json, unauthorized, forbidden, bad,
  table, container, blobSasUrl, safeKey, audit, listDocs, checklistFor, upsertClient,
};
