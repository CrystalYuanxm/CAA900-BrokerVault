# Week 3 Check-in Prep — Team BrokerVault

**Learning and Progress Update 1 — Thursday, Oct 1**
Team: Xinmeng Yuan (solo team). I present all four parts.

## Update 1 plan (5 minutes)

| Part | Time | Speaker | What I show |
|---|---|---|---|
| Learned | 1 min | Xinmeng Yuan | Slide or README |
| Progress | 2 min | Xinmeng Yuan | Azure portal: credit balance, resource group, storage account, private container |
| Blockers | 1 min | Xinmeng Yuan | — |
| Next | 1 min | Xinmeng Yuan | Plan table below |

## Script

### 0. Opening (10 seconds)
"Hi, I'm Xinmeng Yuan, Team BrokerVault. I'm a one-person team, so I own the front end, the backend and database, the cloud setup and security, and the pipeline."

### 1. Learned (1 minute)
"The idea that changed how I'm building is **data classification**. Before this course I would have just put files in cloud storage. My owner is a mortgage agent, and her clients send pay stubs, bank statements and SIN numbers. That is **confidential** data. So I changed my design: storage is **private with no public access**, data stays in the **Canada Central** region, and files will only be reached through short-lived upload links. I decided this first, before writing any code."

### 2. Progress (2 minutes) — show, don't describe
1. "This is my Azure subscription, provided by Seneca." → *show portal home / subscription*
2. "This is my cost control: a monthly budget of 10 US dollars, with an email alert at **50 percent**, which is 5 dollars. My spending so far is **zero**." → *show budget-brokervault page*
3. "These are my first resources: a resource group, `rg-brokervault-dev`, in Canada Central…" → *click it*
4. "…and a storage account, `stbrokervaultxyuan`, with a **private** container called `client-documents`. Anonymous access is disabled. Here's a test pay stub I uploaded. It's encrypted at rest — 'Server encrypted: true'. And if I open its link in a browser, I get *PublicAccessNotPermitted*. The file is in the cloud, but nobody can open it from a public link." → *show container, access level Private, then the denied URL*
5. "Here's my GitHub repository with the README." → *show repo*
6. **Pain point in one sentence:** "My owner, Maria, says: *I never know which client is still missing which document, and I'm nervous about bank statements sitting in my email.*"

### 3. Blockers (1 minute)
"My biggest unknown is **how a client uploads a confidential file without me exposing the storage account**. What I've tried: I made the container private and tested an upload in the portal. I've read about **SAS tokens**, which are short-lived upload links, and I think the answer is a small Azure Function that hands out a SAS token that expires in a few minutes. I'll prove it works by next week."

### 4. Next (1 minute)
"By Progress Submission 2, I own every item:"

| Deliverable (working) | Owner | Done by |
|---|---|---|
| Front end live on Azure Static Web Apps: landing page and client checklist page | Xinmeng Yuan | Mon Oct 5 |
| GitHub Actions pipeline: every push to main deploys the front end | Xinmeng Yuan | Tue Oct 6 |
| Client uploads a file to the private container through a SAS link from an Azure Function | Xinmeng Yuan | Fri Oct 9 |
| Database (Azure SQL free tier) storing clients and their document checklist; agent dashboard reads it | Xinmeng Yuan | Tue Oct 13 |
| Progress Submission 2 document | Xinmeng Yuan | Thu Oct 15 |

"Thank you. Happy to take questions."

## Six check-in questions

> Match these to the six questions in the official template from the Week 3 materials page.

0. *(Cost control)* Budget `budget-brokervault`: 10 USD per month, email alert at 50% (5 USD) of actual cost. Spend to date: 0.00 USD.
1. **What did you learn that changed how you build?** Data classification: client documents are confidential, so storage is private, Canada-only, and accessed through short-lived links.
2. **What is working right now?** Seneca Azure subscription with a 50% budget alert; resource group `rg-brokervault-dev` and storage account `stbrokervaultxyuan` with private container `client-documents`, all in Canada Central; GitHub repository with README.
3. **How are you controlling cost?** A 10 USD monthly budget with an email alert at 50%, plus free tiers (Static Web Apps Free, Functions consumption plan, Azure SQL free offer).
4. **What is your biggest blocker or unknown?** Secure client uploads without exposing storage.
5. **What have you tried?** Private container, manual upload test, reading the SAS token docs. Next step: an Azure Function that issues a SAS token.
6. **What will be done by Progress Submission 2, and who owns it?** See the Next table. I own everything.

## Readiness and gap analysis

| Area | Gap | Action |
|---|---|---|
| People | Solo team: no one to review my work or cover if I fall behind | Ask on the "Need Help / Give Help!" board; keep scope small |
| Process | No CI/CD yet; deploys would be manual | GitHub Actions pipeline by Oct 6 |
| Technology | Never built secure uploads (SAS) or authentication on Azure | Prototype SAS upload by Oct 9; use simple auth first |

**Biggest gap:** Technology. Secure upload and authentication for confidential data.
**Readiness score:** 2 out of 5. The platform and plan are ready; nothing is built yet.
