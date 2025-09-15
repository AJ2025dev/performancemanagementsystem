variable "namespace" { type = string }
variable "postgresql" {
  type = object({
    username      = string
    password      = string
    database      = string
    persistent    = optional(bool, true)
    storage_class = optional(string, null)
    storage_size  = optional(string, "10Gi")
  })
}

