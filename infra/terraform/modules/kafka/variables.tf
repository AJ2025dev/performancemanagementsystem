variable "namespace" { type = string }
variable "kafka" {
  type = object({
    replica_count      = optional(number, 1)
    storage_class      = optional(string, null)
    storage_size       = optional(string, "10Gi")
    zookeeper_replicas = optional(number, 1)
  })
}

