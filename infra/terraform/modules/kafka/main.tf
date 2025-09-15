locals {
  name = "kafka"
}

resource "helm_release" "kafka" {
  name       = local.name
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "kafka"
  namespace  = var.namespace

  values = [
    yamlencode({
      replicaCount = var.kafka.replica_count
      persistence = {
        storageClass = var.kafka.storage_class
        size         = var.kafka.storage_size
      }
      zookeeper = {
        replicaCount = var.kafka.zookeeper_replicas
      }
      externalAccess = {
        enabled      = false
      }
    })
  ]
}

data "kubernetes_service" "kafka" {
  metadata {
    name      = "kafka"
    namespace = var.namespace
  }
  depends_on = [helm_release.kafka]
}

output "bootstrap_servers" {
  value = [
    "kafka.${var.namespace}.svc.cluster.local:9092"
  ]
}

