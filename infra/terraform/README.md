Infrastructure as Code for the Affiliate & Media-Buy Management platform.

This Terraform configuration deploys core dependencies into an existing Kubernetes cluster via the Helm provider:
- Kafka (Bitnami)
- Redis (Bitnami)
- PostgreSQL (Bitnami)
- Monitoring stack: Prometheus + Grafana (kube-prometheus-stack)

Assumptions:
- You have a Kubernetes cluster reachable via `kubeconfig`.
- You have cluster-admin or equivalent permissions to install CRDs/Helm charts.

Quick start:
1. Export `KUBECONFIG` or set provider `kubernetes`/`helm` config.
2. `terraform init`
3. `terraform apply -var="namespace=affnet"`

Outputs include service endpoints and connection strings for use by the microservices.

