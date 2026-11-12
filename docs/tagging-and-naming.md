# Tagging and naming

Every resource we create carries the three tags below. They let us find our resources, see what they cost, and clean them up.

| Tag | Allowed values | Ours |
|---|---|---|
| `Project` | `CAA900` | `CAA900` |
| `Team` | our team id | `brokervault` |
| `Env` | `dev` or `prod` | `dev` |

## Names

Pattern: `caa900-<team>-<purpose>`. Region: `canadacentral` for every resource that holds data (Canadian financial data stays in Canada). Static Web Apps is offered only in a few regions, so the web app is in `eastus2`; it holds static files and API code, never client data.

| Resource | Name | Rule |
|---|---|---|
| Resource group | `caa900-brokervault-rg` | everything for the team goes inside it |
| Static Web App (front end + API) | `caa900-brokervault-web` | region eastus2 (no client data) |
| Storage account (documents + tables) | `caa900brokervaultdocs` | 3 to 24 lowercase letters and digits, no hyphens, globally unique (the earlier name `caa900brokervaultup` stayed reserved after deletion) |
| Blob container | `client-documents` | private, no anonymous access |
| Tables | `Clients`, `Documents`, `Audit`, `Reviews` | inside the storage account |
| Log Analytics workspace | `caa900-brokervault-logs` | 30-day retention, 1 GB daily cap |
| Application Insights | `caa900-brokervault-insights` | linked to the API through app settings |
| Action group and alert | `caa900-brokervault-alerts` / `caa900-brokervault-api-failures` | emails the owner on API server errors |
| Document Intelligence | `caa900-brokervault-docintel` | F0 (free), OCR for scans and photos |
| Budget | `caa900-brokervault-monthly` | one per subscription; alerts at 50% and 80% |
| Deployment | `brokervault-deploy` | name of the Bicep deployment |

## Where the tags are set

- **Portal:** the Tags step before Create. Tags on the resource group do **not** flow down, so each resource gets its own tags.
- **Bicep (used for every resource now):** `var tags = { Project: 'CAA900', Team: team, Env: env }`, with `tags: tags` on every resource.
- **CLI, for anything created by hand:** `az tag update --resource-id "$RESOURCE_ID" --operation Merge --tags Project=CAA900 Team=brokervault Env=dev`
