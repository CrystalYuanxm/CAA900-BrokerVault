# Runbook: recovery test

Goal: prove that BrokerVault can be rebuilt from code and that a deleted client document can be restored, and record how long it takes (RTO).

Run it from **Azure Cloud Shell (Bash)**. Use fictional test documents only.

## Part A: restore a deleted document (soft delete)

1. Sign in as a client and upload a test file (for example `sample-T4-2025-TEST.pdf`). Note the time.
2. Azure portal → storage account `caa900brokervaultdocs` → **Containers** → `client-documents` → open the client's folder → select the test blob → **Delete**.
3. Turn on **Show deleted blobs** → select the deleted blob → **Undelete**. Note the time.
4. As Maria, open the client file and click **Download**: the document opens again.

## Part B: rebuild the infrastructure from Bicep

```bash
cd ~ && rm -rf CAA900-BrokerVault && git clone https://github.com/CrystalYuanxm/CAA900-BrokerVault.git && cd CAA900-BrokerVault
date
az deployment group create -g caa900-brokervault-rg -f infra/main.bicep -n recovery-test -p alertEmail=<your email>
date
```

The deployment is idempotent: it recreates anything missing (container, tables, settings, monitoring, Document Intelligence) and changes nothing that is already correct. Then open the site, sign in as Maria and check the dashboard loads.

## Results

| Test | Date | Started | Finished | Duration | Result |
|---|---|---|---|---|---|
| A. Undelete a document | | | | | |
| B. Redeploy from Bicep | | | | | |
| Earlier real rebuild in a new subscription | 2026-10-22 | | | minutes | Succeeded (docs/evidence/deploy-log.json) |

**Targets** (from the current-state assessment): RTO 4 hours, RPO for documents near 0 (soft delete 7 days and versioning).

Screenshots to keep: the deleted blob, the restored blob, the deployment output with `Succeeded`, and the dashboard after the redeploy.
