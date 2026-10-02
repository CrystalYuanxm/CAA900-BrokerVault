# Readiness and gap analysis: BrokerVault

Week 3 class activity (Thu Oct 1, 2026). Solo team: Xinmeng Yuan. This becomes the risks section of Progress Submission 2.

## Gap table

| Dimension | Current state | Target state | Gap | Remediation (owner: Xinmeng Yuan) |
|-------|-----------|-----------|-------|------------|
| **People** | Has never configured an identity provider (Entra External ID) | Client and owner sign-in with an owner app role, by Oct 13 | Skills gap | Microsoft Learn module, plus a throwaway sign-in spike this week |
| **People** | Has never written IaC (Bicep) | Resource group, storage, Functions and SQL deployed from Bicep, by Oct 17 | Skills gap | Export the current resource group as a Bicep starter; rebuild it once from code |
| **People** | Solo team: no backup and no reviewer | Every component documented and explainable | Single point of failure | Self-review against the definition of done; post on the help board after 48 hours blocked |
| **Process** | Files committed straight to `main` through the web upload | Branch per task, pull request, branch protection | No review step | Turn on branch protection; add a pull request template with a security checklist |
| **Process** | No deployment pipeline | GitHub Actions deploys the front end on every push, by Oct 6 | Manual deploys | Use the workflow that Static Web Apps generates; add the Functions deploy later |
| **Process** | No secret scanning | gitleaks pre-commit and GitHub push protection | Risk of committing a key | Enable push protection this week; add `.env.example` with variable names only |
| **Technology** | Has never issued a SAS from code | A Function issues **write-only, client-prefixed SAS links that expire in 5 minutes**, by Oct 9 | Unknown core integration | Throwaway Function spike: a user delegation SAS with managed identity |
| **Technology** | Event Grid blob trigger never tested | The checklist updates automatically after an upload | Unknown integration | Spike: a Function with an Event Grid trigger on `BlobCreated` |
| **Technology** | Unclear what the lab-managed subscription allows | Entra External ID, the Azure SQL free offer and Functions all confirmed to work, by Oct 8 | Platform limits unknown | Create each service once in a test resource group; ask the instructor how long the subscription lasts |

## Biggest gap

**Technology: the secure, user-scoped upload (SAS issued by a Function).** It is the core action behind the pain point, and it handles restricted financial data. If it stays open:

1. Confidential files could leak, or the storage key could end up in the browser.
2. The MVP misses Progress Submission 3 (Oct 19), because the checklist, the dashboard and the affordability review all depend on uploaded documents.
3. The fallback (uploading through the API) adds cost and complexity, and every file would pass through our code.

## Readiness score

**Medium.** The platform and governance are ready: budget alerts, the naming and tagging convention, private encrypted storage in Canada Central, and the architecture v0. No application code exists yet, the team has one member, and identity, IaC and SAS issuance have never been built.

**Recommendation:** this week, before polishing the front end, build two throwaway spikes: the SAS upload Function and the Entra sign-in. If either fails on the lab subscription, we find out now rather than in Week 6.
