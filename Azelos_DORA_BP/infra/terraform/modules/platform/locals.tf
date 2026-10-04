locals {
  name_prefix = "${var.project_name}-${var.environment}"

  container_uses_acr = can(regex("\\.azurecr\\.io/", var.container_image))
  acr_pull_auth = (
    !local.container_uses_acr ? "none" :
    var.acr_admin_enabled ? "admin" :
    "managed_identity"
  )

  tags = {
    for k, v in {
      project             = var.project_name
      environment         = var.environment
      managed_by          = "terraform"
      owner               = var.owner
      cost_center         = var.cost_center
      data_classification = "confidential"
    } : k => v if v != null && v != ""
  }
}
