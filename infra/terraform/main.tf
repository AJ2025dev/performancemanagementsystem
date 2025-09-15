resource "kubernetes_namespace" "this" {
  metadata { name = var.namespace }
}

module "kafka" {
  source    = "./modules/kafka"
  namespace = var.namespace
  kafka     = var.kafka
  depends_on = [kubernetes_namespace.this]
}

module "redis" {
  source    = "./modules/redis"
  namespace = var.namespace
  redis     = var.redis
  depends_on = [kubernetes_namespace.this]
}

module "postgresql" {
  source     = "./modules/postgresql"
  namespace  = var.namespace
  postgresql = var.postgresql
  depends_on = [kubernetes_namespace.this]
}

module "monitoring" {
  source    = "./modules/monitoring"
  namespace = var.namespace
  depends_on = [kubernetes_namespace.this]
}

