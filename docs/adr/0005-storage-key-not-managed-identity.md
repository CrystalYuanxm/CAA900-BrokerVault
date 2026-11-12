# ADR 0005: Keep a rotated storage key instead of a managed identity

- **Status:** Accepted, Nov 2026 (changes the plan shown at the mid-term: "managed identity, no account key, Nov 16")
- **Decider:** Xinmeng Yuan (solo team)

## Context
The API needs to sign short-lived SAS links. The safest option is a user delegation SAS signed with a managed identity, so no account key exists in the app. Managed functions in Azure Static Web Apps do not support managed identity. Getting one would mean the Standard plan (about $9 a month) plus a separate Function App linked to the site, and moving the API.

## Decision
Keep the storage account key, with these controls:

- the key is written by Bicep into the Static Web App's encrypted app settings; it is never in the repository, the browser or a screenshot;
- SAS links are scoped to one blob, write-only or read-only, HTTPS only, and expire in 5 minutes;
- the key is rotated with no downtime using the `storageKeyIndex` Bicep parameter (runbook: `docs/runbooks/rotate-storage-key.md`), every 90 days or at once after a suspected leak.

## Alternatives considered
| Option | Why not now |
|---|---|
| Standard plan + linked Function App with managed identity + user delegation SAS | About $9 a month (more than the whole current bill), 4 to 6 hours of rework two weeks before the final demo, risk to working features |
| Key Vault reference | Also needs a managed identity |

## Consequences
- If the app settings leaked, storage would be exposed until the key is rotated. The rotation runbook limits that window.
- Upgrade path, if Maria's business grows: Standard plan, bring-your-own Function App with a system-assigned identity, role "Storage Blob Data Contributor", `getUserDelegationKey` for SAS, and remove `STORAGE_CONNECTION_STRING`.
