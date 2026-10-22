// GET /api/me : who am I? First sign-in of a client creates their record (sign-up).
const c = require("../shared/core");
module.exports = async function (context, req) {
  const p = c.getPrincipal(req);
  if (!p) return (context.res = c.unauthorized());
  let isNew = false;
  if (!c.isOwner(p)) {
    isNew = await c.upsertClient(p);
    if (isNew) await c.audit(p, "signup", p.userId);
  }
  context.res = c.json(200, {
    userId: p.userId,
    name: p.userDetails,
    provider: p.identityProvider,
    roles: p.userRoles,
    isOwner: c.isOwner(p),
    isNew,
  });
};
