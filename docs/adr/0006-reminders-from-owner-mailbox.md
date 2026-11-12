# ADR 0006: Reminders sent from Maria's own mailbox

- **Status:** Accepted, Nov 2026 (changes the plan shown at the mid-term: "email reminders, timer Function")
- **Decider:** Xinmeng Yuan (solo team)

## Context
Maria needs to remind clients about missing documents. A fully automatic reminder needs a timer and an email service. Managed functions in Static Web Apps support HTTP triggers only (no timer), Azure Communication Services Email is not open to new customers, and clients who sign in with GitHub give a user name, not an email address.

## Decision
Add a **Send reminder** button to the client file on the dashboard:

1. `POST /api/owner/clients/{id}/reminder` (owner only) records the reminder (`lastReminderAt`, `reminderCount` on the client, and a `reminder-sent` audit entry) and returns the missing documents and, when the sign-in gives one, the client's email address;
2. the browser opens Maria's own mail app with the email already written: the missing documents and the secure upload link, and a request not to send documents by email;
3. Maria checks it and presses Send. The dashboard shows when each client was last reminded.

## Alternatives considered
| Option | Why not |
|---|---|
| GitHub Actions schedule + third-party email API | Needs a new account and API key, 2 to 3 hours; emails come from an unknown sender |
| Separate Function App with a timer trigger | Extra service and deployment path |

## Consequences
- No extra cost, no new secret, and the email comes from the agent the client already knows.
- Not automatic: Maria decides when to remind. A daily summary can be added later with a scheduled workflow.
