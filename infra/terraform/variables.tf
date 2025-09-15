variable "namespace" {
  description = "Kubernetes namespace to deploy dependencies"
  type        = string
  default     = "affnet"
}

variable "kubeconfig" {
  description = "Path to kubeconfig file"
  type        = string
  default     = null
}

variable "postgresql" {
  description = "PostgreSQL configuration overrides"
  type = object({
    username = string
    password = string
    database = string
    persistent = optional(bool, true)
    storage_class = optional(string, null)
    storage_size  = optional(string, "10Gi")
  })
  default = {
    username = "affnet"
    password = "affnetpass"
    database = "affnet"
  }
}

variable "redis" {
  description = "Redis configuration overrides"
  type = object({
    password       = string
    storage_class  = optional(string, null)
    storage_size   = optional(string, "5Gi")
    architecture   = optional(string, "standalone")
  })
  default = {
    password = "affnetredis"
  }
}

variable "kafka" {
  description = "Kafka configuration overrides"
  type = object({
    replica_count  = optional(number, 1)
    storage_class  = optional(string, null)
    storage_size   = optional(string, "10Gi")
    zookeeper_replicas = optional(number, 1)
  })
  default = {}
}

