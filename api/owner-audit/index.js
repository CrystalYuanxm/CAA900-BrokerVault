// GET /api/owner/audit : latest audit entries (owner only)
const c = require("../shared/core");
module.exports = async function (context, req) {
  const p = c.getPrincipal(req);
  if (!p) return (context.res = c.unauthorized());
  if (!c.isOwner(p)) return (context.res = c.forbidden());
  const out = [];
  for await (const e of c.table("Audit").listEntities()) out.push({ when: e.rowKey.split("-")[0], day: e.partitionKey, actor: e.actor, action: e.action, target: e.target });
  out.sort((a, b) => Number(b.when) - Number(a.when));
  context.res = c.json(200, { entries: out.slice(0, 50).map((e) => ({ ...e, when: new Date(Number(e.when)).toISOString() })) });
};
