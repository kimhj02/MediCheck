#!/usr/bin/env bash
set -euo pipefail

# Zero-downtime "near" redeploy strategy for single-node EC2:
# 1) Pull latest code
# 2) Build images
# 3) Recreate backend first and wait until running
# 4) Recreate frontend after backend is stable
#
# Usage:
#   bash scripts/deploy/redeploy.sh
# Optional env:
#   DEPLOY_BRANCH=main
#   PROJECT_DIR=/home/ubuntu/MediCheck

DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
COMPOSE_FILE="docker-compose.aws.yml"
ENV_FILE=".env.aws"

echo "[INFO] Project dir: ${PROJECT_DIR}"
cd "${PROJECT_DIR}"

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "[ERROR] ${COMPOSE_FILE} 파일을 찾을 수 없습니다."
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[ERROR] ${ENV_FILE} 파일을 찾을 수 없습니다. .env.aws.example 참고 후 생성하세요."
  exit 1
fi

if [[ ! -f "backend/server/.env.prod" ]]; then
  echo "[ERROR] backend/server/.env.prod 파일이 필요합니다."
  exit 1
fi

echo "[INFO] Fetching latest code..."
git fetch origin
git checkout "${DEPLOY_BRANCH}"
git pull --ff-only origin "${DEPLOY_BRANCH}"

echo "[INFO] Pre-building backend image..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" build backend

echo "[INFO] Updating backend container..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --no-deps backend

echo "[INFO] Waiting for backend container healthy state..."
for _ in {1..20}; do
  STATUS="$(
    CID="$(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps -q backend)"
    if [[ -n "${CID}" ]]; then
      docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${CID}" 2>/dev/null
    fi || true
  )"
  if [[ "${STATUS}" == "healthy" ]]; then
    echo "[INFO] Backend is healthy."
    break
  fi
  sleep 3
done

STATUS="$(
  CID="$(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps -q backend)"
  if [[ -n "${CID}" ]]; then
    docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${CID}" 2>/dev/null
  fi || true
)"
if [[ "${STATUS}" != "healthy" ]]; then
  echo "[ERROR] Backend가 healthy 상태가 아닙니다. 현재 상태: ${STATUS:-unknown}"
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" logs --tail=100 backend
  exit 1
fi

echo "[INFO] Pre-building frontend image..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" build frontend

echo "[INFO] Updating frontend container..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --no-deps frontend

echo "[INFO] Cleaning dangling images..."
docker image prune -f >/dev/null 2>&1 || true

echo "[DONE] Redeploy completed."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps
