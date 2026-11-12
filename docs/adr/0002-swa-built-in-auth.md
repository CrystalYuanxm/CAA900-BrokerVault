# ADR 0002: Sign-in with Static Web Apps built-in authentication

- **Status:** Accepted, Oct 2026 (replaces the plan to use Entra External ID)
- **Decider:** Xinmeng Yuan (solo team)

## Context
The plan in architecture v0 was Entra External ID with an `owner` app role. Registering an app in the Seneca tenant needs admin consent ("Approval required"), and the school account cannot sign in to new apps. We still need sign-up, sign-in, an owner role and token checks.

## Decision
Use the built-in authentication of Azure Static Web Apps:

- clients sign in with a Microsoft or GitHub account; the first call to `GET /api/me` creates their client record;
- Maria gets the custom role `owner` by invitation (Role management);
- `staticwebapp.config.json` allows `/api/*` only for authenticated users, and `/owner.html`, `/calculator.html` and `/api/owner/*` only for `owner`;
- Static Web Apps validates the session and passes the user in the `x-ms-client-principal` header; every owner Function checks the role again, and client Functions use only the user id from that header.

## Alternatives considered
| Option | Why not |
|---|---|
| Entra External ID | Blocked by tenant consent policy |
| Own username and password store | Security risk and effort; passwords would be our responsibility |

## Consequences
- No custom sign-up page or self-service password reset (the identity providers handle that).
- Owner access is managed by invitation links, which expire and must be renewed.
