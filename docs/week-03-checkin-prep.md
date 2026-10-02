# Week 3 check-in and Update 1 prep: BrokerVault

| Item | Detail |
|-------|------------------------------|
| Team | BrokerVault (team id `brokervault`, solo team) |
| Members | Xinmeng Yuan (GitHub: CrystalYuanxm) |
| Platform and region | Azure, Seneca-provided subscription *Seneca College: DSM760NCE-1041*, owned by Xinmeng Yuan, Canada Central |
| Repository | <https://github.com/CrystalYuanxm/CAA900-BrokerVault> |
| Live URL | Not yet. The front end goes live on Azure Static Web Apps by Mon Oct 5. |

## 1. Learning and Progress Update 1 (5 minutes, strict)

Presented in class on Thu Oct 1, 2026. As a solo team, Xinmeng Yuan leads and speaks in every part.

| Part | Time | Speaker | What we say or show |
|------|----|--------|------------------------------------|
| Learned | 1 min | Xinmeng Yuan | **Data classification.** Pay stubs, bank statements and SINs are restricted financial data. We therefore chose a private container with no anonymous access, encryption at rest, the Canada Central region and short-lived SAS links, before writing any code. |
| Progress | 2 min | Xinmeng Yuan | Pain point in one sentence: *"I never know which client is still missing which document, and I'm nervous about bank statements and SINs sitting in my email."* Shown live: the Azure console with the budget alert at 50% ($10 a month, spend $0.00); the resource group and storage account in Canada Central; the private container `client-documents` with a fictional test pay stub (*Server encrypted: true*); its public URL returning *PublicAccessNotPermitted*; and the GitHub repository with the README. |
| Blockers | 1 min | Xinmeng Yuan | Biggest unknown: how a client uploads a confidential file without exposing the storage account or its keys. Tried so far: made the container private, tested a manual upload, confirmed that public access is blocked, and read the SAS documentation. Plan: a Function issues write-only SAS links that expire in 5 minutes. |
| Next | 1 min | Xinmeng Yuan | True by Progress Submission 2 (Mon Oct 5): the front end live with the owner view and the customer view, architecture v1, and the identity and network design. Owner of every item: Xinmeng Yuan. |

**Note:** on Oct 1 the first resources were named `rg-brokervault-dev` and `stbrokervaultxyuan`. Right after the check-in we rebuilt them with the course convention (`caa900-brokervault-rg`, `caa900brokervaultup`, budget `caa900-brokervault-monthly`) and the tags `Project=CAA900`, `Team=brokervault` and `Env=dev`. Then we deleted the old ones.

## 2. Check-in answers (10 minutes with the instructor)

| Check-in question | Our answer | Who answers |
|------------|------------------------------|-------|
| Who is on the team, and who did what in Submission 1? | Xinmeng Yuan (solo): the persona and pain point; the Azure setup (resource group, private storage, budget alert, tags); the current-state assessment; architecture v0; the team charter; the README; and a prototype of the affordability review page. | Xinmeng Yuan |
| Say the pain point in the owner's words. Who is the second user role? | "Every client has to send me ten or more documents, and they come in by email, text, WhatsApp, whatever. I never know who is still missing what, and I'm nervous about bank statements and SINs sitting in my email." Second role: the **client (borrower)**. | Xinmeng Yuan |
| Which reference pattern, and what is different in your version? | **Pattern D, secure file intake.** We added Pattern B's per-client checklist and owner dashboard but kept them serverless (Azure Functions on the Consumption plan and the Azure SQL free offer) instead of App Service and PostgreSQL, to keep the cost under $1 a month. We added an owner-only affordability review (GDS/TDS and the stress test). Document Intelligence uses a custom model as a stretch goal, because the prebuilt pay stub model is US-only. | Xinmeng Yuan |
| Is the platform working? Show the console and your cost control. | Yes. The portal is open on the subscription *Seneca College: DSM760NCE-1041*, with budget `caa900-brokervault-monthly` ($10 a month, email alerts at 50% and 80%, spend $0.00). The account owner is Xinmeng Yuan, and there are no teammates to add. | Xinmeng Yuan |
| What is the first thing you will show live on Oct 8 (Update 2)? | The front end live at our Static Web Apps URL, with the **client view** (document checklist and upload page) and the **owner view** (Maria's dashboard and the affordability review), using fictional sample data. | Xinmeng Yuan |
| Any concern about the team, workload, or the topic? | Workload as a solo team. Our MVP is a secure upload, a per-client checklist and the owner dashboard. We cut SMS, and Document Intelligence is a stretch goal. A second concern: the lab-managed subscription may expire or restrict services, so we will confirm its lifetime with the instructor. | Xinmeng Yuan |

## 3. Open these before class

- [x] Azure portal signed in to the project subscription
- [x] Budget `caa900-brokervault-monthly`, with alerts at 50% and 80%
- [x] The first resources: `caa900-brokervault-rg`, `caa900brokervaultup` and container `client-documents` (created Oct 1 as `rg-brokervault-dev` and `stbrokervaultxyuan`, then renamed by rebuilding)
- [x] GitHub repository: README with the persona, pain point and user roles; instructor DC-Seneca invited as a collaborator
- [x] Progress Submission 1 and architecture v0 (`docs/architecture-v0.png`)
- [x] Nothing secret on screen: no access keys, connection strings or `.env` files

## 4. After the check-in

Instructor decision:

- [x] Topic approved
- [ ] Approved with changes
- [ ] Resubmit

| # | Action agreed at the check-in | Owner | Due |
|--|------------------------------|-------|---------|
| 1 | Add an **affordability review page** for the owner: while reviewing a client's documents, Maria calculates the maximum purchase price (GDS ≤ 39%, TDS ≤ 44%, qualifying rate = the higher of the contract rate + 2% and 5.25%). The prototype is `calculator.html`; next, it reads client data from the database. | Xinmeng Yuan | Prototype done Oct 1; connected to the database by Oct 27 |
| 2 | Run the API on **Azure Functions on a Consumption plan** (pay per execution, scales to zero) so that idle cost stays near $0. We will use Flex Consumption with always-ready instances set to 0, and record the decision as `docs/adr/0001-functions-consumption.md`. | Xinmeng Yuan | ADR by Oct 5; first Function by Oct 9 |

These actions are copied into the next meeting notes, and the risks are in `docs/readiness-gap-analysis.md`.
