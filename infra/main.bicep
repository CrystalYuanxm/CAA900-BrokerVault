// BrokerVault infrastructure (CAA900, team brokervault)
// Deploy:  az deployment group create -g caa900-brokervault-rg -f infra/main.bicep -p alertEmail=<your email>
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

@description('Email that receives monitoring alerts. Passed at deploy time; not stored in the repository.')
param alertEmail string

@description('Which storage key the API uses (0 = key1, 1 = key2). Switch it to rotate keys without downtime; see docs/runbooks/rotate-storage-key.md.')
@allowed([ 0, 1 ])
param storageKeyIndex int = 0

@description('Document Intelligence tier: F0 is free (500 pages a month, first 2 pages per file). Only one F0 per subscription.')
@allowed([ 'F0', 'S0' ])
param docIntelSku string = 'F0'

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

// ---------- Monitoring: logs + one alert on failed API requests ----------
resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'caa900-${team}-logs'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    workspaceCapping: {
      dailyQuotaGb: 1 // hard cap so a bug cannot run up the bill
    }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'caa900-${team}-insights'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logs.id
  }
}

resource alertGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'caa900-${team}-alerts'
  location: 'global'
  tags: tags
  properties: {
    groupShortName: 'bvalerts'
    enabled: true
    emailReceivers: [
      {
        name: 'owner-email'
        emailAddress: alertEmail
        useCommonAlertSchema: true
      }
    ]
  }
}

resource failedRequestsAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'caa900-${team}-api-failures'
  location: 'global'
  tags: tags
  properties: {
    description: 'The API returned server errors (5xx) in the last 15 minutes.'
    severity: 2
    enabled: true
    scopes: [ appInsights.id ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'failed-requests'
          criterionType: 'StaticThresholdCriterion'
          metricNamespace: 'microsoft.insights/components'
          metricName: 'requests/failed'
          operator: 'GreaterThan'
          threshold: 0
          timeAggregation: 'Count'
        }
      ]
    }
    actions: [
      {
        actionGroupId: alertGroup.id
      }
    ]
  }
}

// ---------- Document Intelligence: OCR for scanned or photographed income documents ----------
resource docIntel 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: 'caa900-${team}-docintel'
  location: location
  tags: tags
  kind: 'FormRecognizer'
  sku: {
    name: docIntelSku
  }
  properties: {
    customSubDomainName: 'caa900-${team}-docintel'
    publicNetworkAccess: 'Enabled'
  }
}

// ---------- API settings (stored encrypted by Azure, never in the repo) ----------
resource webSettings 'Microsoft.Web/staticSites/config@2023-01-01' = {
  parent: web
  name: 'appsettings'
  properties: {
    STORAGE_CONNECTION_STRING: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${storage.listKeys().keys[storageKeyIndex].value};EndpointSuffix=${environment().suffixes.storage}'
    DOCS_CONTAINER: containerName
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
    DOCINTEL_ENDPOINT: docIntel.properties.endpoint
    DOCINTEL_KEY: docIntel.listKeys().key1
  }
}

output webUrl string = 'https://${web.properties.defaultHostname}'
output webName string = web.name
output storageAccount string = storage.name
output appInsightsName string = appInsights.name
output docIntelName string = docIntel.name
