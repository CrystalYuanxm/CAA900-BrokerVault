# DR test log

## Test 1: delete a client document and restore it

- **Date:** 2026-11-26 (Toronto time)
- **Runbook:** [runbooks/recovery-test.md](../runbooks/recovery-test.md)
- **Data:** fictional test file `sample-paystub-TEST.pdf`, uploaded by the test client as the employment letter
- **Storage:** `caa900brokervaultdocs` / `client-documents`, blob versioning on, soft delete 7 days

| Time | Step | Result |
|---|---|---|
| 12:19 | Client uploads the file | Checklist 3 of 6, Employment letter Received |
| 12:21 | Delete the blob in the Azure portal | "Successfully deleted 1 blobs"; folder empty |
| 12:22 | Maria downloads the file | Fails: `BlobNotFound` |
| 12:23 | Show active and deleted blobs | The file is kept as a previous version |
| 12:26 | Make the previous version current | Blob active again, 1.78 KiB |
| 12:27 | Maria downloads the file | Opens correctly |

Screenshots of every step are in the Final Project Report, Section 7.2 (kept out of this public repository because they show account details).

**RTO achieved:** 6 minutes from deletion to verified restore (target: 1 hour).
**RPO achieved:** 0: the restored file has the same name and size; the database record never changed.

## Test 2: rebuild the whole environment from Bicep

- **Date:** 2026-10-22, after the subscription changed and the old resources were gone
- **Command:** `az deployment group create -g caa900-brokervault-rg -f infra/main.bicep -n brokervault-deploy`
- **Result:** Succeeded ([deploy-log.json](deploy-log.json)); the only change was the storage account name, because the old name was still reserved. The pipeline then redeployed the code and the owner was re-invited.
- Later deployments from the same file: `brokervault-deploy-3` (2026-11-12, monitoring and Document Intelligence) and `brokervault-deploy-4` (2026-11-23, SonarQube fixes), both Succeeded.
