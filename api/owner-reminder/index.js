// POST /api/owner/clients/{clientId}/reminder  (owner only)
// Records that Maria is sending a reminder and returns what the email needs: the client's address
// (when their sign-in gives one) and the documents still missing. The email itself is sent from
// Maria's own mailbox (mailto link in the dashboard), so no email service or extra cost is needed.
const c = require("../shared/core");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function (context, req) {
  const p = c.getPrincipal(req);
  if (!p) return (context.res = c.unauthorized());
  if (!c.isOwner(p)) return (context.res = c.forbidden()); // checked here as well as in staticwebapp.config.json
  const clientId = c.safeKey(context.bindingData.clientId || "");

  let client;
  try {
    client = await c.table("Clients").getEntity("client", clientId);
  } catch {
    return (context.res = c.json(404, { error: "Client not found" }));
  }
  const checklist = c.checklistFor(await c.listDocs(clientId));
  const missing = checklist.items.filter((i) => i.status === "missing").map((i) => i.label);
  if (!missing.length) return (context.res = c.bad("This client has sent every document. No reminder needed."));

  const now = new Date().toISOString();
  await c.table("Clients").upsertEntity(
    { partitionKey: "client", rowKey: clientId, lastReminderAt: now, reminderCount: (client.reminderCount || 0) + 1 },
    "Merge"
  );
  await c.audit(p, "reminder-sent", clientId);

  context.res = c.json(200, {
    to: EMAIL.test(client.name || "") ? client.name : null, // GitHub sign-ins give a user name, not an email
    name: client.name,
    missing,
    received: checklist.received,
    total: checklist.total,
    lastReminderAt: now,
    reminderCount: (client.reminderCount || 0) + 1,
  });
};
