locals { name = "redis" }

resource "helm_release" "redis" {
  name       = local.name
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "redis"
  namespace  = var.namespace

  values = [
    yamlencode({
      architecture = var.redis.architecture
      auth = {
        password = var.redis.password
      }
      master = {
        persistence = {
          storageClass = var.redis.storage_class
          size         = var.redis.storage_size
        }
      }
    })
  ]
}

output "host" { value = "redis-master.${var.namespace}.svc.cluster.local" }
output "port" { value = 6379 }

