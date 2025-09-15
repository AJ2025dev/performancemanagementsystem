# Affiliate & Media-Buy Management Platform

Production-ready microservices monorepo for managing affiliates, offers, click and conversion tracking, media-buy integrations, AI creative helpers, and reporting dashboards.

## Stack
- Backend: Node.js + Express (TypeScript)
- Event streaming: Kafka (Bitnami Helm chart)
- Data: PostgreSQL (Bitnami), Redis (Bitnami)
- Infra: Terraform (Helm provider) targeting any Kubernetes cluster
- Orchestration: Kubernetes (manifests in `k8s/`)
- Monitoring: Prometheus + Grafana (kube-prometheus-stack)
- Frontend: Next.js + React + TypeScript (`apps/web`)
- CI/CD: GitHub Actions per service (Docker build/push + K8s rollout)

## Services
- api-gateway: REST gateway with JWT auth, rate limiting, reverse proxy to downstream services
- auth-service: User CRUD, roles (admin/manager/affiliate), JWT issuance
- click-service: `/clicks` endpoint, publishes to Kafka `clicks`, caches in Redis
- conversion-service: Kafka consumer for `clicks` and `conversions`, fraud stub, persist to Postgres; `/conversions` endpoint to ingest
- postback-service: Configurable mapping engine to send callbacks with retry/backoff (consumes `conversions`)
- media-buy-service: Unified connectors for Facebook/Google Ads/TikTok; create/update campaigns and fetch stats
- ai-tools-service: Creative helpers (`/ai/generate-copy`, `/ai/generate-image`) with stubbed providers
- reporting-service: GraphQL API aggregating metrics from Postgres (`/graphql`)
- catalog-service: Offers and Affiliates CRUD (read under `/catalog/*`, write under `/admin/catalog/*`)

## Database Schema
DDL is provided in `db/schema.sql` for `users`, `affiliates`, `offers`, `clicks`, `conversions`.

## Getting Started (Local Dev)
1. Prereqs: Node 20+, Docker, a Kubernetes cluster (e.g., kind, k3d, minikube), kubectl, helm, terraform.
2. Provision infra to your cluster using Terraform:
   - cd `infra/terraform`
   - `terraform init`
   - `terraform apply -var="namespace=affnet"`
3. Apply K8s app manifests:
   - `kubectl apply -f k8s/namespace.yaml`
   - `kubectl apply -f k8s/configmap-env.yaml -f k8s/secrets.yaml`
   - `kubectl apply -f k8s/*.yaml` (after images are available, see CI/CD or run locally)
4. Run services locally (for iteration) with env pointing to cluster services:
   - Export env: `KAFKA_BROKERS=kafka.affnet.svc.cluster.local:9092` `REDIS_HOST=redis-master.affnet.svc.cluster.local` `REDIS_PORT=6379` `POSTGRES_HOST=postgresql.affnet.svc.cluster.local` `POSTGRES_DB=affnet` `POSTGRES_USER=affnet` `POSTGRES_PASSWORD=affnetpass` `JWT_SECRET=supersecretjwt`
   - Install deps and start: `npm ci && npm run dev` inside each `services/*` folder
5. Frontend:
   - cd `apps/web` and `npm ci && npm run dev`
   - Set `NEXT_PUBLIC_GATEWAY_URL` to your API Gateway URL (Ingress or port-forward)

## Local Docker Compose
Spin up Postgres, Redis, Kafka/Zookeeper, all services, and the API gateway locally.

- `docker compose up --build -d` (services + gateway)
- Gateway available at `http://localhost:3000`
- Postgres available at `localhost:5432` (affnet/affnetpass)
- Redis available at `localhost:6379`
- Kafka broker at `localhost:9092` (internal DNS `kafka:9092`)

Notes:
- Database schema is loaded automatically on first start from `db/schema.sql`.
- Services auto-connect using internal Docker DNS names (e.g., `postgres`, `redis`, `kafka`).
- To view logs: `docker compose logs -f <service>` (e.g., `affnet-gateway`).

### Include the Web App (Next.js)
- Production image (port 4000):
  - `docker compose --profile prod up --build -d web`
  - Open `http://localhost:4000`
- Dev mode with hot reload (port 4001):
  - `docker compose --profile dev up -d web-dev`
  - Open `http://localhost:4001`
  - Changes under `apps/web` reload automatically

## Makefile
Common tasks are wrapped in a Makefile:
- `make up` / `make down` / `make logs`
- `make web-prod` or `make web-dev`
- `make test-all` to run Jest across all services and the web app
- `make build-all` to build Docker images
- `make tf-init` / `make tf-apply` / `make tf-destroy` for Terraform
- `make k8s-apply` / `make k8s-delete` for Kubernetes manifests

## CI/CD
- Each service has a workflow in `.github/workflows/*-service.yml`:
  - Installs deps, runs tests (Jest), builds TypeScript
  - Builds and pushes image to GHCR
  - Applies rolling image update in the `affnet` namespace
- Required repository secrets:
  - `KUBE_CONFIG_BASE64`: base64-encoded kubeconfig with deploy permissions

## Kubernetes
- Manifests in `k8s/` include Deployments + Services for all microservices and a simple Ingress to the API gateway (nginx ingress controller required).
- Add `k8s/catalog-service.yaml` for the new Catalog service and update `k8s/configmap-env.yaml` with `CATALOG_SERVICE_URL`.
- Infra dependencies (Kafka/Redis/Postgres/Grafana/Prometheus) are managed via Terraform Helm releases under `infra/terraform`.

### Staging Namespace
- Separate manifests under `k8s-staging/` target the `affnet-staging` namespace, with environment wiring to the `-staging` service DNS.
- Apply once to bootstrap: `make k8s-apply-staging`.
- CI/CD selects namespace based on branch:
  - Pushes to `staging` branch deploy to `affnet-staging`.
  - Other branches (e.g., `main`) deploy to `affnet`.

## Testing
- Unit tests: Jest per service (`npm test`).
- Frontend: React Testing Library (sample setup included).
- E2E: Cypress specs in `cypress/e2e/*` that cover click→conversion flow and media-buy workflows (targeting the API gateway base URL).
 - E2E specs authenticate via `/auth/signup` and attach JWT to requests.

## Seeding Demo Data
- `make seed` seeds demo users (admin + affiliate), multiple clicks, and conversions via the API Gateway.
- Configure `GATEWAY_URL` env var if not using the default `http://localhost:3000`.

### Realistic Dataset
- `make seed-realistic` creates multiple affiliates and 3 offers, and generates clicks/conversions distributed over the last ~2 weeks with varied payouts (including rare high-payout fraud flags).
- This uses the gateway’s JWT-protected routes and respects rate limits with small delays.

## Per‑Service Testing
- `make test-all` runs Jest across all services and the web app.
- `make test SERVICE=<name|web>` runs tests for one component (e.g., `make test SERVICE=auth-service`).
- Shortcut aliases: `make test-<name>` (e.g., `make test-api-gateway`, `make test-web`).

## Notes
- AI provider calls are stubbed unless `OPENAI_API_KEY` / `STABILITY_API_KEY` are provided. Network access must be enabled at runtime to use external APIs.
- The gateway expects JWTs from `auth-service` for protected routes. Public routes under `/auth/*` are open.
- Adjust Helm values in Terraform variables for production storage classes and replica counts.

## Next Steps
- Add persistent user/offer/affiliate CRUD UIs in the web app.
- Harden services (validation, schemas, observability, tracing).
- Add production Ingress/TLS and external DNS, secrets management (e.g., External Secrets).
