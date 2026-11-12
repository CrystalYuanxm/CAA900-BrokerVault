# ADR 0004: Bicep for Infrastructure as Code

- **Status:** Accepted, Oct 2026
- **Decider:** Xinmeng Yuan (solo team)

## Context
The course requires Infrastructure as Code with a deployment log. The project is Azure-only and maintained by one person.

## Decision
Use one Bicep file, `infra/main.bicep`, deployed with `az deployment group create`. It creates the Static Web App, the storage account (container, tables, CORS, soft delete, versioning), the API app settings and the tags on every resource.

## Alternatives considered
| Option | Why not |
|---|---|
| Terraform | Multi-cloud is not needed; it adds a state file to store and protect |
| Portal clicks | Not repeatable; nothing to review in Git |

## Consequences
- Proven on Oct 22, 2026: after the subscription changed, the whole stack was rebuilt from this file in minutes (`docs/evidence/deploy-log.json`). The only change was the storage account name, because the old one was still reserved.
