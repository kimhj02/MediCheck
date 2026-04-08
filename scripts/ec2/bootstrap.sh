#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/ec2/bootstrap.sh
#
# This script is intended for Ubuntu-based EC2 instances.

if [[ "${EUID}" -eq 0 ]]; then
  echo "[ERROR] root 계정으로 실행하지 말고 일반 사용자로 실행하세요."
  exit 1
fi

echo "[INFO] Installing Docker dependencies..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git

echo "[INFO] Adding Docker apt repository..."
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "[INFO] Installing Docker engine + compose plugin..."
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "[INFO] Enabling Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

echo "[INFO] Adding current user to docker group..."
sudo usermod -aG docker "$USER"

echo "[DONE] Bootstrap completed."
echo "       새 로그인 세션(또는 reboot) 후 아래를 확인하세요:"
echo "       docker --version"
echo "       docker compose version"
