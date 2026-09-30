locals {
  name_prefix = "${var.project_name}-${var.environment}"

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
