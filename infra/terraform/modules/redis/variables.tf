variable "namespace" { type = string }
variable "redis" {
  type = object({
    password      = string
    storage_class = optional(string, null)
    storage_size  = optional(string, "5Gi")
    architecture  = optional(string, "standalone")
  })
}

