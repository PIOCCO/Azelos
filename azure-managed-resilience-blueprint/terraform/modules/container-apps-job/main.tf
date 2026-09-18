resource "azurerm_container_app_job" "scheduled_sync" {
  name                         = var.job_name
  location                     = var.location
  resource_group_name          = var.resource_group_name
  container_app_environment_id = var.container_app_environment_id

  replica_timeout_in_seconds = 900
  replica_retry_limit        = 1

  schedule_trigger_config {
    cron_expression          = var.cron_expression
    parallelism              = 1
    replica_completion_count = 1
  }

  template {
    container {
      name    = "sync"
      image   = var.api_image
      cpu     = 0.25
      memory  = "0.5Gi"
      command = ["python", "/app/scripts/run_scheduled_sync.py"]

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }
      env {
        name  = "DEMO_MODE"
        value = var.demo_mode
      }
      env {
        name  = "SYNC_TENANT_IDS"
        value = var.sync_tenant_ids
      }
      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }
    }
  }

  secret {
    name  = "database-url"
    value = var.database_url
  }
}
