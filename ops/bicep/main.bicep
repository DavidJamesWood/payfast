param namePrefix string
param location string = 'eastus'

resource ai 'Microsoft.Insights/components@2020-02-02' = {
  name: '${namePrefix}-ai'
  location: location
  kind: 'web'
  properties: { Application_Type: 'web' }
}

resource plan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${namePrefix}-plan'
  location: location
  sku: { name: 'B1', tier: 'Basic' }
}

resource api 'Microsoft.Web/sites@2022-09-01' = {
  name: '${namePrefix}-api'
  location: location
  properties: {
    httpsOnly: true
    serverFarmId: plan.id
    siteConfig: {
      linuxFxVersion: 'PYTHON|3.11' // or switch to DOCKER later
      appSettings: [
        { name: 'APPINSIGHTS_CONNECTIONSTRING', value: ai.properties.ConnectionString }
        // TODO: DATABASE_URL, OIDC_* (or move to Key Vault)
      ]
    }
  }
}

output apiName string = api.name
output appInsightsConnection string = ai.properties.ConnectionString