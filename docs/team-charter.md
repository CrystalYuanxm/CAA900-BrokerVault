# Team charter: BrokerVault

| Item | Detail |
|---|---|
| Team name | BrokerVault |
| Team id | `brokervault` (resource names such as `caa900-brokervault-rg`) |
| Repository | <https://github.com/CrystalYuanxm/CAA900-BrokerVault> |
| Platform and region | Azure (Seneca-provided subscription) owned by Xinmeng Yuan, Canada Central |
| OPC and pain point | Maria Chen, independent mortgage agent: "I never know who is still missing what, and I'm nervous about bank statements and SINs sitting in my email." |
| Scope for our team size | Solo: MVP only (affordability review and Document Intelligence are stretch goals) |
| Charter version | 1.0, agreed 2026-10-01, to be reviewed in Week 9 |

**1. Members and roles**

| Member | GitHub username | Primary role | Backup role |
|---|---|---|---|
| Xinmeng Yuan | CrystalYuanxm | All: front end, backend, infrastructure and security, data, DevOps | None (solo); help from the "Need Help / Give Help!" board |

Rotating duties (facilitator, note-taker, submitter and update lead) are all held by Xinmeng Yuan.

**2. Component ownership**: Xinmeng Yuan owns every component, and the backup for each is none.

| Component | Target |
|---|---|
| Architecture diagram | v0 in Submission 1; v1 Oct 5; final Nov 26 |
| Front end (owner view and customer view) | Live by Oct 5 |
| Identity, API, database, IaC, CI/CD | Submission 3 (Oct 19) |
| File storage (private container, SAS) | Upload working by Oct 9 |
| Payment equivalent: affordability review (and Document Intelligence as a stretch) | Submission 4 (Nov 16) |
| Messaging, monitoring, security hardening, DR test | Submission 4 (Nov 16) |
| Cost log and budget alarm (50% and 80%) | Set up in Submission 1; reported in every submission |

**3. How we work**: a weekly planning session on Sunday at 7 p.m. (45 minutes), with notes committed to `docs/meetings/YYYY-MM-DD.md` within 24 hours. The channel is Seneca email and the course board, with a reply within 24 hours on weekdays. Tasks live in GitHub Issues and a Project board, each with an owner and a due date. Each task has its own branch and a pull request into `main` that is self-reviewed against the definition of done, and branch protection is on. Git `user.name` and `user.email` match the GitHub account. Secrets are kept only in Key Vault and GitHub encrypted secrets, never in code or screenshots. Availability: about 10 hours a week.

**4. How we decide**: the owner of a component decides, and any architecture decision is recorded as an ADR in `docs/adr/`. Neither the deadlines nor the scope change without informing the instructor.

**5. Definition of done**: merged into `main` through a self-reviewed pull request; deployed by IaC or the pipeline, not by hand; works from the public URL in the right role; no secrets in code or history; resources named `caa900-brokervault-…` and tagged; requests and errors visible in the logs; evidence in `docs/evidence/`; README, diagram and risk register updated.

**6. Conflict and escalation (solo)**: if blocked for more than 48 hours, post on the "Need Help / Give Help!" board. If it is still blocked after the next class, email david.chan2@senecapolytechnic.ca with "CAA900 BrokerVault team concern" in the subject.

**7. Signature**: Xinmeng Yuan, 2026-10-01.
