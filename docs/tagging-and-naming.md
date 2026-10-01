# Tagging and naming

Every resource we create carries the three tags below. They let us find our resources, see what they cost, and clean them up.

| Tag | Allowed values | Ours |
|---|---|---|
| `Project` | `CAA900` | `CAA900` |
| `Team` | our team id | `brokervault` |
| `Env` | `dev` or `prod` | `dev` |

## Names

Pattern: `caa900-<team>-<purpose>`. Region: `canadacentral` for every resource (Canadian financial data stays in Canada).

| Resource | Name | Rule |
|---|---|---|
| Resource group | `caa900-brokervault-rg` | everything for the team goes inside it |
| Storage account (client documents) | `caa900brokervaultup` | 3 to 24 lowercase letters and digits, no hyphens, globally unique |
| Blob container | `client-documents` | private, no anonymous access |
| Budget | `caa900-brokervault-monthly` | one per subscription; alerts at 50% and 80% |
| Function app (planned) | `caa900-brokervault-api` | one name per app |
| Static Web App (planned) | `caa900-brokervault-web` | |
| Azure SQL server and database (planned) | `caa900-brokervault-sql` / `caa900-brokervault-db` | |
| Key Vault (planned) | `caa900-brokervault-kv` | 3 to 24 characters, globally unique |

## Where the tags are set

- **Portal:** the Tags step before Create. Tags on the resource group do **not** flow down, so each resource gets its own tags.
- **Bicep (from Submission 3):** `var tags = { Project: 'CAA900', Team: team, Env: env }`, with `tags: tags` on every resource.
- **CLI, for anything created by hand:** `az tag update --resource-id "$RESOURCE_ID" --operation Merge --tags Project=CAA900 Team=brokervault Env=dev`
