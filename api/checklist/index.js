// GET /api/checklist : the signed-in client's own document checklist
const c = require("../shared/core");
module.exports = async function (context, req) {
  const p = c.getPrincipal(req);
  if (!p) return (context.res = c.unauthorized());
  const docs = await c.listDocs(p.userId); // filtered by the user id in the token, never by a request parameter
  context.res = c.json(200, c.checklistFor(docs));
};
