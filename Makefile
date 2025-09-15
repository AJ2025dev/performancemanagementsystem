SHELL := /bin/bash

# Services list for looped tasks
SERVICES := api-gateway auth-service click-service conversion-service postback-service media-buy-service ai-tools-service reporting-service

.PHONY: help up down logs web-prod web-dev test-all test test-% test-web build-all tf-init tf-apply tf-destroy k8s-apply k8s-delete k8s-apply-staging k8s-delete-staging k8s-restart k8s-restart-staging e2e seed seed-realistic

help:
	@echo "Targets:"
	@echo "  up          - docker compose up (services + gateway)"
	@echo "  down        - docker compose down -v"
	@echo "  logs        - docker compose logs -f"
	@echo "  web-prod    - build+run Next.js (profile prod) on :4000"
	@echo "  web-dev     - run Next.js dev (profile dev) on :4001"
	@echo "  test-all    - install deps and run tests for all services + web"
	@echo "  test        - run tests for a single service: make test SERVICE=<name|web>"
	@echo "  test-<name> - run tests for a single service via target alias, e.g. test-api-gateway"
	@echo "  build-all   - build all service images via docker compose"
	@echo "  tf-init     - terraform init (infra/terraform)"
	@echo "  tf-apply    - terraform apply namespace=affnet (infra/terraform)"
	@echo "  tf-destroy  - terraform destroy (infra/terraform)"
	@echo "  k8s-apply   - kubectl apply -f k8s/*.yaml"
	@echo "  k8s-delete  - kubectl delete -f k8s/*.yaml"
	@echo "  k8s-apply-staging  - kubectl apply -f k8s-staging/*.yaml"
	@echo "  k8s-delete-staging - kubectl delete -f k8s-staging/*.yaml"
	@echo "  k8s-restart        - rollout restart all deployments in affnet"
	@echo "  k8s-restart-staging - rollout restart all deployments in affnet-staging"
	@echo "  e2e         - run Cypress e2e against http://localhost:3000"
	@echo "  seed        - seed demo users, clicks, conversions via gateway"
	@echo "  seed-realistic - larger dataset across multiple days, offers, affiliates"

up:
	docker compose up --build -d

down:
	docker compose down -v

logs:
	docker compose logs -f

web-prod:
	docker compose --profile prod up --build -d web

web-dev:
	docker compose --profile dev up -d web-dev

test-all:
	@set -e; \
	for s in $(SERVICES); do \
	  echo "==> Testing $$s"; \
	  (cd services/$$s && npm ci && npm test -- --ci --passWithNoTests); \
	done; \
	 echo "==> Testing web"; \
	 (cd apps/web && npm ci && npm test -- --ci --passWithNoTests)

# Test a single service: make test SERVICE=auth-service (or SERVICE=web)
test:
	@if [ -z "$(SERVICE)" ]; then echo "Usage: make test SERVICE=<service|web>"; exit 1; fi; \
	if [ "$(SERVICE)" = "web" ]; then \
	  (cd apps/web && npm ci && npm test -- --ci --passWithNoTests); \
	else \
	  (cd services/$(SERVICE) && npm ci && npm test -- --ci --passWithNoTests); \
	fi

# Alias targets: test-api-gateway, test-auth-service, etc.
test-%:
	(cd services/$* && npm ci && npm test -- --ci --passWithNoTests)

test-web:
	(cd apps/web && npm ci && npm test -- --ci --passWithNoTests)

build-all:
	docker compose build

tf-init:
	cd infra/terraform && terraform init

tf-apply:
	cd infra/terraform && terraform apply -auto-approve -var="namespace=affnet"

tf-destroy:
	cd infra/terraform && terraform destroy -auto-approve -var="namespace=affnet"

k8s-apply:
	kubectl apply -f k8s/namespace.yaml && kubectl apply -f k8s/configmap-env.yaml -f k8s/secrets.yaml && kubectl apply -f k8s

k8s-delete:
	kubectl delete -f k8s || true

k8s-apply-staging:
	kubectl apply -f k8s-staging/namespace.yaml && kubectl apply -f k8s-staging/configmap-env.yaml -f k8s-staging/secrets.yaml && kubectl apply -f k8s-staging

k8s-delete-staging:
	kubectl delete -f k8s-staging || true

k8s-restart:
	kubectl -n affnet rollout restart deploy --all

k8s-restart-staging:
	kubectl -n affnet-staging rollout restart deploy --all

e2e:
	npx cypress run

seed:
	node scripts/seed.mjs

seed-realistic:
	node scripts/seed_realistic.mjs
