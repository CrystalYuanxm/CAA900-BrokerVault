// GET /api/owner/clients : Maria's dashboard (owner role only)
const c = require("../shared/core");
module.exports = async function (context, req) {
  const p = c.getPrincipal(req);
  if (!p) return (context.res = c.unauthorized());
  if (!c.isOwner(p)) return (context.res = c.forbidden()); // checked here as well as in staticwebapp.config.json

  const clients = [];
  for await (const e of c.table("Clients").listEntities({ queryOptions: { filter: "PartitionKey eq 'client'" } })) clients.push(e);
  const docsByClient = {};
  for await (const d of c.table("Documents").listEntities()) (docsByClient[d.partitionKey] = docsByClient[d.partitionKey] || []).push(d);

  const rows = clients.map((cl) => {
    const docs = docsByClient[cl.rowKey] || [];
    const cl2 = c.checklistFor(docs);
    const last = docs.map((d) => d.uploadedAt).sort().pop() || null;
    return {
      clientId: cl.rowKey,
      name: cl.name,
      demo: !!cl.demo,
      received: cl2.received,
      total: cl2.total,
      missing: cl2.items.filter((i) => i.status === "missing").map((i) => i.label),
      lastUpload: last,
      createdAt: cl.createdAt,
    };
  });
  rows.sort((a, b) => a.received - b.received || String(a.name).localeCompare(b.name));
  const complete = rows.filter((r) => r.received === r.total).length;
  context.res = c.json(200, { clients: rows, summary: { clients: rows.length, complete, waiting: rows.length - complete } });
};
