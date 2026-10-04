locals {
  acr_admin_username_effective = coalesce(
    var.acr_admin_username != null && trimspace(var.acr_admin_username) != "" ? trimspace(var.acr_admin_username) : null,
    var.acr_registry_name,
    try(regex("^([^.]+)", var.acr_login_server)[0], null)
  )
  acr_admin_pull_ready = (
    var.acr_admin_password != null &&
    trimspace(var.acr_admin_password) != "" &&
    local.acr_admin_username_effective != null &&
    trimspace(local.acr_admin_username_effective) != ""
  )
}

resource "azurerm_user_assigned_identity" "app" {
  name                = "${var.name_prefix}-app-id"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_role_assignment" "acr_pull" {
  count                = var.use_acr_registry && var.acr_pull_auth == "managed_identity" ? 1 : 0
  scope                = var.acr_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

resource "azurerm_role_assignment" "kv_secrets_user" {
  count                = var.use_custom_vnet ? 1 : 0
  scope                = var.key_vault_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

resource "azurerm_container_app_environment" "this" {
  name                       = "${var.name_prefix}-cae"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = var.log_analytics_workspace_id
  infrastructure_subnet_id   = var.use_custom_vnet ? var.container_apps_subnet_id : null
  tags                       = var.tags

  dynamic "workload_profile" {
    for_each = var.use_custom_vnet ? [1] : []
    content {
      name                  = "Consumption"
      workload_profile_type = "Consumption"
      minimum_count         = 0
      maximum_count         = 10
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "azurerm_container_app" "app" {
  name                         = "${var.name_prefix}-app"
  container_app_environment_id = azurerm_container_app_environment.this.id
  resource_group_name          = var.resource_group_name
  revision_mode         = "Single"
  workload_profile_name = var.use_custom_vnet ? "Consumption" : null
  tags                  = var.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app.id]
  }

  dynamic "registry" {
    for_each = var.use_acr_registry && var.acr_pull_auth == "managed_identity" ? [1] : []
    content {
      server   = var.acr_login_server
      identity = azurerm_user_assigned_identity.app.id
    }
  }

  dynamic "registry" {
    for_each = var.use_acr_registry && var.acr_pull_auth == "admin" && local.acr_admin_pull_ready ? [1] : []
    content {
      server               = var.acr_login_server
      username             = local.acr_admin_username_effective
      password_secret_name = "acr-password"
    }
  }

  dynamic "secret" {
    for_each = var.use_acr_registry && var.acr_pull_auth == "admin" && local.acr_admin_pull_ready ? [1] : []
    content {
      name  = "acr-password"
      value = var.acr_admin_password
    }
  }

  lifecycle {
    precondition {
      condition = (
        var.acr_pull_auth != "admin" ||
        local.acr_admin_pull_ready
      )
      error_message = "ACR admin pull requires admin_enabled on the registry and a non-empty admin password. Run: terraform apply -target=module.platform.module.container_registry (or az acr update --admin-enabled true), then apply again."
    }
  }

  dynamic "secret" {
    for_each = var.use_custom_vnet ? [1] : []
    content {
      name                = "database-url"
      key_vault_secret_id = var.secret_ids.database_url
      identity            = azurerm_user_assigned_identity.app.id
    }
  }

  dynamic "secret" {
    for_each = var.use_custom_vnet ? [1] : []
    content {
      name                = "jwt-secret-key"
      key_vault_secret_id = var.secret_ids.jwt_secret_key
      identity            = azurerm_user_assigned_identity.app.id
    }
  }

  dynamic "secret" {
    for_each = var.use_custom_vnet || var.inline_secrets == null ? [] : [1]
    content {
      name  = "database-url"
      value = var.inline_secrets.database_url
    }
  }

  dynamic "secret" {
    for_each = var.use_custom_vnet || var.inline_secrets == null ? [] : [1]
    content {
      name  = "jwt-secret-key"
      value = var.inline_secrets.jwt_secret_key
    }
  }

  ingress {
    external_enabled = true
    target_port      = 8000
    transport        = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = "dora-bp"
      image  = var.container_image
      cpu    = var.cpu
      memory = var.memory

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name        = "JWT_SECRET_KEY"
        secret_name = "jwt-secret-key"
      }

      dynamic "env" {
        for_each = var.app_environment_variables
        content {
          name  = env.key
          value = env.value
        }
      }

      liveness_probe {
        transport = "HTTP"
        port      = 8000
        path      = "/health"
      }

      readiness_probe {
        transport = "HTTP"
        port      = 8000
        path      = "/ready"
      }
    }
  }
}
