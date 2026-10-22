# BrokerVault API

All routes are under `/api` on the Static Web App. The caller must be signed in, and Static Web Apps passes the validated user in `x-ms-client-principal`. Owner routes need the `owner` role, which is checked in `staticwebapp.config.json` **and** again in the Function code.

| Method and route | Who | What it does |
|---|---|---|
| `GET /api/me` | Signed-in user | Returns the user and roles. The first call by a client creates their record (sign-up). |
| `GET /api/checklist` | Client | Returns the caller's own six-document checklist (filtered by the user id in the token). |
| `POST /api/upload-url` | Client | Validates the type (PDF, JPG or PNG) and the size (10 MB or less); returns a **write-only SAS for one new blob** under the caller's prefix, valid 5 minutes. |
| `POST /api/documents` | Client | Checks that the blob exists and belongs to the caller, then records it in the `Documents` table. |
| `GET /api/download-url?doc=&client=` | Owner, or the owning client | Returns a **read-only SAS valid 5 minutes**; writes an audit entry. |
| `GET /api/owner/clients` | Owner | All clients with received and missing counts. |
| `GET /api/owner/clients/{id}/documents` | Owner | One client's checklist and documents. |
| `POST /api/owner/seed` | Owner | Adds three fictional sample clients for demos. |
| `GET /api/owner/audit` | Owner | The latest 50 audit entries. |

## Data (Azure Table Storage, account `caa900brokervaultdocs`)
| Table | PartitionKey | RowKey | Holds |
|---|---|---|---|
| `Clients` | `client` | user id | name, identity provider, createdAt, lastSeen |
| `Documents` | user id | document id | docType, fileName, blobName, size, uploadedAt |
| `Audit` | date | time and GUID | actor, action, target |

Files live in the private container `client-documents` as `<userId>/<docType>/<guid>.<ext>`.
