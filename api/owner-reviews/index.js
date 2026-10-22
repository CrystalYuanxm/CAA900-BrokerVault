// GET  /api/owner/reviews?client=<id> : latest affordability review for a client (owner only)
// POST /api/owner/reviews {clientId, inputs, result, notes} : save a review (latest + history)
const c = require("../shared/core");
const NUM_FIELDS = ["inc1", "inc2", "loans", "cards", "other", "down", "tax", "heat", "condo", "rate"];
module.exports = async function (context, req) {
  const p = c.getPrincipal(req);
  if (!p) return (context.res = c.unauthorized());
  if (!c.isOwner(p)) return (context.res = c.forbidden());
  const t = c.table("Reviews");
  await t.createTable().catch(() => {}); // created on first use

  if (req.method === "GET") {
    const clientId = c.safeKey(req.query.client || "");
    try {
      const e = await t.getEntity(clientId, "latest");
      return (context.res = c.json(200, { review: { inputs: JSON.parse(e.inputs), result: JSON.parse(e.result), notes: e.notes, savedAt: e.savedAt, savedBy: e.savedBy } }));
    } catch {
      return (context.res = c.json(200, { review: null }));
    }
  }

  const { clientId, inputs, result, notes } = req.body || {};
  if (!clientId || !inputs) return (context.res = c.bad("clientId and inputs are required"));
  try { await c.table("Clients").getEntity("client", c.safeKey(clientId)); } catch { return (context.res = c.json(404, { error: "Client not found" })); }
  const clean = { amort: String(inputs.amort) === "30" ? "30" : "25", buyer: inputs.buyer === "repeat" ? "repeat" : "first" };
  for (const f of NUM_FIELDS) { const n = Number(inputs[f]); if (!isFinite(n) || n < 0 || n > 1e8) return (context.res = c.bad(`Invalid value for ${f}`)); clean[f] = n; }
  const savedAt = new Date().toISOString();
  const entity = {
    partitionKey: c.safeKey(clientId),
    inputs: JSON.stringify(clean),
    result: JSON.stringify(result || {}),
    notes: String(notes || "").slice(0, 2000),
    savedAt,
    savedBy: p.userDetails,
  };
  await t.upsertEntity({ ...entity, rowKey: "latest" }, "Replace");
  await t.createEntity({ ...entity, rowKey: `h-${Date.now()}` });
  await c.audit(p, "affordability-review", clientId);
  context.res = c.json(200, { savedAt });
};
