# Cost log: BrokerVault

Budget: `caa900-brokervault-monthly`, $10 per month on the subscription, email alerts at 50% ($5) and 80% ($8) of actual cost.

| Date | Who | Month-to-date cost | Credit or budget used | What changed | Action |
|---|---|---|---|---|---|
| 2026-10-01 | Xinmeng Yuan | $0.00 | 0% | Created the resource group, storage account, private container and budget | None |
| 2026-10-03 | Xinmeng Yuan | $0.00 | 0% | Rebuilt the resources with the naming convention and tags; deleted the old resource group | None |
| 2026-10-22 | Xinmeng Yuan | $0.00 | 0% | New subscription (Azure for Students); redeployed everything from Bicep; Static Web App Free + storage; budget re-created | None |

## Rules we follow

- Serverless and free tiers only: Static Web Apps Free with managed Functions (consumption), Table Storage, Document Intelligence F0 if added.
- Storage: Standard, LRS, Hot; soft delete 7 days.
- Check Cost analysis at the end of every work session and add a row here.
