#!/usr/bin/env bash
#
# Post-provision deploy: run this after `terraform apply` has produced a
# running instance (see ../README.md). It is idempotent — safe to re-run
# after code changes to redeploy.
#
# Usage:
#   ./deploy.sh ubuntu@<public-ip> [path-to-ssh-private-key]
#
# Env overrides:
#   SSH_KEY_PATH         default: ~/.ssh/oci_sidebyside
#   APP_PORT             default: 3000 (app listens on 127.0.0.1 only; Caddy is the public listener)
#   BASIC_AUTH_USER      default: admin
#   BASIC_AUTH_PASSWORD  default: randomly generated, printed at the end
#
# What it does on the remote box:
#   1. installs Node.js 22 + native-module build tooling (idempotent)
#   2. rsyncs this repo up (excluding node_modules, .next, .git, data, terraform state)
#   3. npm install && npm run build
#   4. builds the sandbox Docker image from docker/sandbox.Dockerfile
#   5. installs + enables a systemd unit so the app survives reboots/crashes
#   6. installs Caddy as a reverse proxy on :80 with HTTP Basic Auth in front
#      of the app (the app itself never listens on a public interface)
#
# What it deliberately does NOT do:
#   - create data/gateways.json (your real gateway API keys) — that file is
#     gitignored and must be created by hand directly on the box.

set -euo pipefail

REMOTE="${1:?Usage: deploy.sh <user@host> [ssh_key_path]}"
KEY="${2:-${SSH_KEY_PATH:-$HOME/.ssh/oci_sidebyside}}"
APP_PORT="${APP_PORT:-3000}"
BASIC_AUTH_USER="${BASIC_AUTH_USER:-admin}"
BASIC_AUTH_PASSWORD="${BASIC_AUTH_PASSWORD:-$(openssl rand -base64 18)}"
REMOTE_APP_DIR="/home/ubuntu/sidebyside"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

chmod 600 "$KEY" 2>/dev/null || true
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 -i "$KEY")

echo "==> waiting for SSH on $REMOTE"
for _ in $(seq 1 30); do
  if ssh "${SSH_OPTS[@]}" "$REMOTE" true 2>/dev/null; then
    break
  fi
  sleep 10
done
ssh "${SSH_OPTS[@]}" "$REMOTE" true 2>/dev/null || {
  echo "Could not reach $REMOTE over SSH after 5 minutes." >&2
  exit 1
}

echo "==> waiting for cloud-init to finish (installs docker on first boot)"
ssh "${SSH_OPTS[@]}" "$REMOTE" 'sudo cloud-init status --wait' || true

echo "==> installing Node.js 22 + build tooling"
ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s <<'REMOTE_BOOTSTRAP'
set -euo pipefail
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo apt-get install -y build-essential python3 make g++ rsync
REMOTE_BOOTSTRAP

echo "==> syncing app code to $REMOTE:$REMOTE_APP_DIR"
rsync -az --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude data \
  --exclude 'deploy/oracle/terraform/.terraform' \
  --exclude 'deploy/oracle/terraform/terraform.tfstate*' \
  --exclude 'deploy/oracle/terraform/terraform.tfvars' \
  -e "ssh ${SSH_OPTS[*]}" \
  "$REPO_ROOT/" "$REMOTE:$REMOTE_APP_DIR/"

echo "==> npm install + build on remote"
ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s <<REMOTE_BUILD
set -euo pipefail
cd "$REMOTE_APP_DIR"
npm install
npm run build
mkdir -p data
REMOTE_BUILD

echo "==> building sandbox Docker image"
ssh "${SSH_OPTS[@]}" "$REMOTE" \
  "cd $REMOTE_APP_DIR/docker && docker build -t sidebyside-sandbox -f sandbox.Dockerfile ."

echo "==> installing systemd unit"
ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s <<REMOTE_SYSTEMD
set -euo pipefail
sudo tee /etc/systemd/system/sidebyside.service > /dev/null <<'UNIT'
[Unit]
Description=SideBySide
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$REMOTE_APP_DIR
Environment=NODE_ENV=production
Environment=PORT=$APP_PORT
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable --now sidebyside
sleep 2
sudo systemctl is-active --quiet sidebyside || {
  echo "WARNING: sidebyside.service failed to start. Check: journalctl -u sidebyside -n 50" >&2
}
REMOTE_SYSTEMD

echo "==> installing Caddy (reverse proxy + basic auth in front of the app)"
ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s <<'REMOTE_CADDY_INSTALL'
set -euo pipefail
if ! command -v caddy >/dev/null 2>&1; then
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | sudo gpg --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo apt-get update
  sudo apt-get install -y caddy
fi
REMOTE_CADDY_INSTALL

AUTH_HASH="$(ssh "${SSH_OPTS[@]}" "$REMOTE" "caddy hash-password --plaintext '$BASIC_AUTH_PASSWORD'")"

ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s <<REMOTE_CADDY_CONFIG
set -euo pipefail
sudo tee /etc/caddy/Caddyfile > /dev/null <<CADDYFILE
:80 {
    basicauth {
        $BASIC_AUTH_USER $AUTH_HASH
    }
    reverse_proxy 127.0.0.1:$APP_PORT
}
CADDYFILE
sudo systemctl restart caddy
sleep 2
sudo systemctl is-active --quiet caddy || {
  echo "WARNING: caddy failed to start. Check: journalctl -u caddy -n 50" >&2
}
REMOTE_CADDY_CONFIG

PUBLIC_HOST="${REMOTE#*@}"
echo ""
echo "✓ Deployed."
echo "  URL:      http://$PUBLIC_HOST/"
echo "  Auth:     $BASIC_AUTH_USER / $BASIC_AUTH_PASSWORD"
echo ""
echo "Still manual: create $REMOTE_APP_DIR/data/gateways.json on the box"
echo "itself with your real gateway API keys — it's gitignored and this"
echo "script never syncs it in either direction."
echo ""
echo "Re-run this script any time after pushing code changes to redeploy."
