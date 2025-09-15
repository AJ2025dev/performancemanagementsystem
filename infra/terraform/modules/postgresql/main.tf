locals { name = "postgresql" }

resource "helm_release" "postgresql" {
  name       = local.name
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "postgresql"
  namespace  = var.namespace

  values = [
    yamlencode({
      auth = {
        username = var.postgresql.username
        password = var.postgresql.password
        database = var.postgresql.database
      }
      primary = {
        persistence = {
          enabled      = var.postgresql.persistent
          storageClass = var.postgresql.storage_class
          size         = var.postgresql.storage_size
        }
      }
    })
  ]
}

output "host" { value = "${local.name}.${var.namespace}.svc.cluster.local" }
output "port" { value = 5432 }

