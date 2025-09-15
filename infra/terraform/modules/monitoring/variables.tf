variable "namespace" { type = string }
variable "grafana_admin_password" {
  type        = string
  description = "Grafana admin password"
  default     = "admin123"
}

