# Runbook: rotate the storage account key

The API signs its 5-minute SAS links with a storage account key, held only in the Static Web App's encrypted app settings (see ADR 0005). Rotate the key every 90 days, or at once if it may have leaked. There is no downtime: the API moves to the second key before the first one is replaced.

Run in **Azure Cloud Shell (Bash)** from a fresh clone of the repository.

```bash
cd ~ && rm -rf CAA900-BrokerVault && git clone https://github.com/CrystalYuanxm/CAA900-BrokerVault.git && cd CAA900-BrokerVault

# 1. Switch the API to key2
az deployment group create -g caa900-brokervault-rg -f infra/main.bicep -n rotate-to-key2 \
  -p alertEmail=<your email> storageKeyIndex=1

# 2. Replace key1 (anything still using the old key1 stops working)
az storage account keys renew -g caa900-brokervault-rg -n caa900brokervaultdocs --key key1 --query "[].keyName" -o tsv
```

Next rotation: renew `key2` after switching back with `storageKeyIndex=0`.

Check afterwards: sign in as a client and upload a file; as Maria, download it. Record the rotation in `docs/cost-log.md` or the meeting notes (date and which key is active). Never paste key values into chats, screenshots or the repository.
