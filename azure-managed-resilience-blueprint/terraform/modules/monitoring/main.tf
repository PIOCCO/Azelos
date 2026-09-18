resource "azurerm_monitor_action_group" "cost" {
  name                = var.action_group_name
  resource_group_name = var.resource_group_name
  short_name          = "amrfcost"

  email_receiver {
    name          = "admin"
    email_address = var.alert_email
  }
}

resource "azurerm_consumption_budget_subscription" "mvp" {
  name            = var.budget_name
  subscription_id = var.subscription_id

  amount     = var.budget_amount
  time_grain = "Monthly"

  time_period {
    start_date = var.budget_start_date
  }

  notification {
    enabled        = true
    threshold      = 50
    operator       = "GreaterThan"
    contact_emails = [var.alert_email]
  }

  notification {
    enabled        = true
    threshold      = 75
    operator       = "GreaterThan"
    contact_emails = [var.alert_email]
  }

  notification {
    enabled        = true
    threshold      = 90
    operator       = "GreaterThan"
    contact_emails = [var.alert_email]
  }
}
