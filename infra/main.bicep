// BrokerVault infrastructure (CAA900, team brokervault)
// Deploy:  az deployment group create -g caa900-brokervault-rg -f infra/main.bicep
// Creates: private storage (blob container + tables) in Canada Central,
//          Azure Static Web App (Free) with managed Functions API,
//          app settings for the API, and CORS limited to the web app's URL.

@description('Team id used in resource names (lowercase letters and digits).')
param team string = 'brokervault'

@allowed([ 'dev', 'prod' ])
param env string = 'dev'

@description('Region for data (storage). Canadian financial data stays in Canada.')
param location string = resourceGroup().location

@description('Static Web Apps is offered only in a few regions; it hosts static files and the API code, not client data.')
@allowed([ 'eastus2', 'centralus', 'westus2', 'westeurope', 'eastasia' ])
param webLocation string = 'eastus2'

var tags = {
  Project: 'CAA900'
  Team: team
  Env: env
}

var storageName = 'caa900${team}docs'
var webName = 'caa900-${team}-web'
var containerName = 'client-documents'

// ---------- Static Web App (front end + managed Functions API) ----------
resource web 'Microsoft.Web/staticSites@2023-01-01' = {
  name: webName
  location: webLocation
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {}
}

// ---------- Storage: private documents + tables ----------
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowSharedKeyAccess: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
  properties: {
    isVersioningEnabled: true
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    cors: {
      corsRules: [
        {
          // Only the BrokerVault web app may upload/download from the browser
          allowedOrigins: [ 'https://${web.properties.defaultHostname}' ]
          allowedMethods: [ 'PUT', 'GET', 'HEAD', 'OPTIONS' ]
          allowedHeaders: [ '*' ]
          exposedHeaders: [ '*' ]
          maxAgeInSeconds: 3600
        }
      ]
    }
  }
}

resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: containerName
  properties: {
    publicAccess: 'None'
  }
}

resource tableService 'Microsoft.Storage/storageAccounts/tableServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource clientsTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-05-01' = {
  parent: tableService
  name: 'Clients'
}

resource documentsTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-05-01' = {
  parent: tableService
  name: 'Documents'
}

resource auditTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-05-01' = {
  parent: tableService
  name: 'Audit'
}

resource reviewsTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-05-01' = {
  parent: tableService
  name: 'Reviews'
}

// ---------- API settings (stored encrypted by Azure, never in the repo) ----------
resource webSettings 'Microsoft.Web/staticSites/config@2023-01-01' = {
  parent: web
  name: 'appsettings'
  properties: {
    STORAGE_CONNECTION_STRING: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${storage.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
    DOCS_CONTAINER: containerName
  }
}

output webUrl string = 'https://${web.properties.defaultHostname}'
output webName string = web.name
output storageAccount string = storage.name
