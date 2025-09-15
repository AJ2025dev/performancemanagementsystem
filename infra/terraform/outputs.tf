output "postgresql_connection" {
  description = "PostgreSQL connection details"
  value = {
    host     = module.postgresql.host
    port     = module.postgresql.port
    database = var.postgresql.database
    username = var.postgresql.username
    password = var.postgresql.password
  }
  sensitive = true
}

output "redis_connection" {
  description = "Redis connection details"
  value = {
    host     = module.redis.host
    port     = module.redis.port
    password = var.redis.password
  }
  sensitive = true
}

output "kafka_brokers" {
  description = "Kafka bootstrap servers"
  value       = module.kafka.bootstrap_servers
}

output "monitoring_urls" {
  description = "Grafana and Prometheus service URLs"
  value = {
    grafana_url    = module.monitoring.grafana_url
    prometheus_url = module.monitoring.prometheus_url
  }
}

