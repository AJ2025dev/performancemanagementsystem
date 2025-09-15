locals { name = "kube-prometheus" }

resource "helm_release" "kube_prometheus_stack" {
  name       = local.name
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = var.namespace

  values = [
    yamlencode({
      grafana = {
        adminPassword = var.grafana_admin_password
        service = { type = "ClusterIP" }
      }
      prometheus = {
        service = { type = "ClusterIP" }
      }
    })
  ]
}

output "grafana_url" {
  value = "kube-prometheus-grafana.${var.namespace}.svc.cluster.local"
}

output "prometheus_url" {
  value = "kube-prometheus-kube-p-prometheus.${var.namespace}.svc.cluster.local"
}

