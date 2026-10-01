# Current-state assessment: BrokerVault

Async activity output (Week 2), included in Progress Submission 1.

## Step 1. The owner today

| Tool | How Maria uses it today | Problem |
|---|---|---|
| Email (personal inbox) | Clients email pay stubs, T4s, bank statements and ID | Restricted data sits unencrypted in her inbox indefinitely |
| WhatsApp and text messages | Clients send photos of documents | Low-quality images; files are scattered across apps |
| Phone | Chasing missing documents | About 2 to 3 hours a week on reminder calls |
| Google Drive folders | One folder per client, files saved manually | Manual renaming and filing; no audit of who opened what |
| Excel checklist | One row per client, a column per document | Often out of date; it is the only view of who is missing what |
| Online affordability calculators | Re-types income and debts from the documents | Double entry; nothing saved with the client file |

**Estimated cost:** about **6 to 8 hours a week** on chasing, filing and re-typing, and about **14 days** to collect a complete package for each client. A delayed package can push a client past their financing-condition date.

**Pain point (owner's words):** "I never know who is still missing what, I spend hours chasing people, and honestly I'm nervous about bank statements and SINs sitting in my email."

## Step 2. Application inventory for the solution

| Component | Purpose | Used by | Data it holds | Class |
|---|---|---|---|---|
| Front end (Static Web Apps) | Client portal, owner dashboard, affordability review | Owner, client | None (static files) | Public |
| Identity (Entra External ID) | Sign-up and sign-in; owner app role | Owner, client | Name, email, password hash (held by Microsoft) | Confidential |
| API (Azure Functions, HTTP) | SAS issuance, checklist, documents, affordability | System | None stored; processes tokens | — |
| Upload processor (Function, Event Grid trigger) | Validate the file, write metadata, call extraction | System | None stored | — |
| Database (Azure SQL, free offer) | Clients, documents, checklist items, extracted fields, reviews, audit log | System, owner | Names, contact info, income figures, results | Restricted |
| File storage (Blob, private container) | The documents themselves | Owner, client (own files only) | Pay stubs, T4s, bank statements, ID | Restricted |
| Document Intelligence (F0, custom model; stretch) | Read gross pay and YTD from pay stubs and T4s | System | Processed transiently | Restricted (in transit) |
| Messaging (email API; Timer Function) | Reminders for missing documents; upload alerts to the owner | Owner, client | Email address, document names | Confidential |
| Secrets (Key Vault) | Connection strings and keys; managed identity where possible | System | Secrets | Restricted |
| Monitoring (Application Insights) | Logs, one alert on failures | Owner (developer) | Request logs, no document content | Internal |

## Step 3. Dependencies

| Dependency | Depends on | Would it stop the solution? |
|---|---|---|
| Front end → Entra External ID | Sign-in and tokens | **Yes**: nobody can sign in |
| Front end → Functions API | Every action | **Yes** |
| Functions → Blob Storage (SAS) | Uploads and downloads | **Yes**: the core action |
| Blob Storage → Event Grid → upload processor | Checklist updates after upload | Partly: the files are safe but the checklist lags |
| Functions → Azure SQL | Checklist, metadata, audit log | **Yes** |
| Upload processor → Document Intelligence | Income extraction (stretch) | No: Maria enters the figures manually |
| Timer Function → email API | Reminders | No: reminders are delayed |
| Functions → Key Vault (managed identity) | Secrets at start-up | **Yes** |
| GitHub Actions → Azure | Deployments | No, for users; it blocks releases |

**The dependency we are unsure how to implement:** issuing **user-scoped SAS links from a Function** (user delegation SAS with managed identity), so that a client can upload only into their own prefix and never read another client's files. We will prototype it first, by Oct 9.

## Step 4. Service-level targets

| Target | Value | How we measure it (SLI) |
|---|---|---|
| Availability (portal and API) | **99.5%** a month (about 3.6 hours of downtime allowed) | Application Insights availability test every 5 minutes |
| Main action: get an upload link | Under **1 second** at the 95th percentile | API latency in Application Insights |
| Upload of a 5 MB PDF | Under **10 seconds** on home broadband | Browser timing during testing |
| Owner dashboard load | Under **2 seconds** | Application Insights page views |
| RTO (core records and documents) | **4 hours** | Recovery test in Week 10 (rebuild from Bicep) |
| RPO for the database | **24 hours** or better (Azure SQL point-in-time restore) | Restore test in Week 10 |
| RPO for documents | **0**: soft delete (7 days) and blob versioning | Delete-and-restore test |

**What an outage costs the owner:** a client who cannot upload before a financing-condition deadline may lose the property or need an extension, and Maria may lose a commission worth thousands of dollars. The same documents would also go back to email, which is the problem we are solving.

## Step 5. Data classification

| Class | Data items | Controls |
|---|---|---|
| **Public** | Landing page, list of required documents, agent contact details | Static hosting; anyone can read |
| **Internal** | Checklist status, upload timestamps, reminder schedule, application logs (no document content) | Signed-in users only; logs kept 30 days |
| **Confidential** (personal information under PIPEDA) | Client names, emails, phone numbers, addresses | Encrypted at rest; a client sees only their own record (filtered by the user id in the token); the owner sees all; kept 7 years after closing as an agent record, then deleted |
| **Restricted** (financial) | Pay stubs, T4s, NOAs, bank statements, ID, SIN, extracted income, affordability results | Private container, no anonymous access, encryption at rest, HTTPS only; access only through short-lived SAS links issued after a token check (owner, or the owning client); every download written to the audit log; region Canada Central; SINs never stored in the database; no real data in testing |

## Step 6. Conclusion

- **What worries us most:** the **restricted documents** (pay stubs, bank statements, ID). Our response: a private container, a user-scoped SAS that expires in 5 minutes, an audit log of every download, and fictional data only in development.
- **Pattern and change:** we follow **Pattern D (secure file intake)**. The one thing we change is to add Pattern B's client portal and owner dashboard on serverless services (Functions and the Azure SQL free offer) instead of always-on App Service, keeping the cost under $1 a month.
- **Three risks for the next two weeks:** (1) implementing the user-scoped SAS correctly; (2) solo capacity to get the front end live by Oct 5; (3) whether the lab-managed subscription allows Entra External ID and lasts the whole term.
