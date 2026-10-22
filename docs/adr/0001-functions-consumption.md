# ADR 0001: API on Azure Functions (Consumption), hosted by Static Web Apps

- **Status:** Accepted, Oct 2026
- **Decider:** Xinmeng Yuan (solo team); recommended by the instructor at the Week 3 check-in

## Context
BrokerVault's API is small (about nine HTTP operations) and idle most of the day. Maria is a one-person business, so the cloud bill must stay near zero, and as a solo team we cannot spend time patching servers.

## Decision
Run the API as **Azure Functions (Node.js) on a consumption model**, as the managed API of the **Azure Static Web App (Free)** `caa900-brokervault-web`:

- pay per execution, scales to zero when nobody uses it;
- one GitHub Actions workflow deploys the front end and the API together;
- the API is served from the same origin as the front end, so no CORS rule is needed for the API;
- Static Web Apps validates the sign-in and passes the user (and the `owner` role) to every Function, which checks it again in code.

## Alternatives considered
| Option | Why not |
|---|---|
| App Service or Container Apps (Pattern B) | Always on: about $13 to $50 a month, plus patching |
| Separate Function App (Flex Consumption) | Also pay-per-use, but needs its own CORS, deployment credentials and auth wiring; we may move to it if we need Event Grid triggers or managed identity |

## Consequences
- Managed Functions support HTTP triggers only. The post-upload step therefore runs as an API call (`POST /api/documents`) that verifies the blob, not as an Event Grid trigger.
- Managed Functions do not support managed identity, so the storage connection string is kept in the Static Web App's encrypted application settings (set by Bicep, never in the repository).
