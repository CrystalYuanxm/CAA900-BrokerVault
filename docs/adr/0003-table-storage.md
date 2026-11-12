# ADR 0003: Table Storage instead of Azure SQL

- **Status:** Accepted, Oct 2026
- **Decider:** Xinmeng Yuan (solo team)

## Context
Architecture v0 planned the Azure SQL free offer. Our records are small and always read by a known key: clients, documents per client, audit entries, and the latest review per client. No joins or reports are needed.

## Decision
Use Azure Table Storage in the same storage account as the documents, with four tables:

| Table | PartitionKey | RowKey |
|---|---|---|
| Clients | `client` | user id |
| Documents | user id | document id |
| Audit | date | time + GUID |
| Reviews | client id | `latest` or `h-<time>` |

All reads and writes go through the API (`@azure/data-tables`).

## Alternatives considered
| Option | Why not |
|---|---|
| Azure SQL (free offer) | Firewall rules, auto-pause cold starts and a schema to manage for a handful of rows |
| Cosmos DB | More than we need; extra service to secure |

## Consequences
- No SQL queries or joins; the API builds the dashboard counts in code.
- Point-in-time restore is not available for tables; recovery relies on rebuilding from Bicep and on blob soft delete and versioning for the documents themselves.
