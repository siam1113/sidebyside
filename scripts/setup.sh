#!/usr/bin/env bash
#
# One-shot local setup for this repo. Checks prerequisites, installs
# dependencies, and (if Docker is available) builds the CLI Sandbox image.
# Safe to re-run any time.
#
# Usage:
#   ./scripts/setup.sh
#
# What it does:
#   1. Checks for Node.js 20+ (22 recommended -- what this repo is built/tested against)
#   2. Runs `npm install` (this also fixes node-pty's executable bit via
#      the existing postinstall script)
#   3. If Docker is installed and running, builds the sandbox image used by
#      the CLI Sandbox tab (Claude Code / Codex / Copilot in a container)
#   4. Prints what to do next
#
# What it deliberately skips:
#   - Docker is optional. The Chat/Images/Embeddings/Evaluation playgrounds
#     all work without it -- only the Sandbox tab needs the container image.
#   - No API keys or .env file needed to get started: gateways (OpenAI,
#     Anthropic, Azure OpenAI, Google Gemini, ...) are added from the
#     Settings page at runtime and stored in data/gateways.json (gitignored).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

MIN_NODE_MAJOR=20
RECOMMENDED_NODE_MAJOR=22

echo "==> Checking for Node.js"
if ! command -v node >/dev/null 2>&1; then
  cat >&2 <<'EOF'

✗ Node.js not found.

Install Node 22 (recommended) and re-run this script:
  macOS (Homebrew):  brew install node@22
  Linux (nvm):       nvm install 22 && nvm use 22
  Or download directly from https://nodejs.org/

EOF
  exit 1
fi

node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [[ "$node_major" -lt "$MIN_NODE_MAJOR" ]]; then
  echo "✗ Node.js $node_major found, but this repo needs $MIN_NODE_MAJOR+ (${RECOMMENDED_NODE_MAJOR} recommended)." >&2
  echo "  Upgrade with nvm (nvm install $RECOMMENDED_NODE_MAJOR && nvm use $RECOMMENDED_NODE_MAJOR) or from https://nodejs.org/" >&2
  exit 1
fi
if [[ "$node_major" -lt "$RECOMMENDED_NODE_MAJOR" ]]; then
  echo "   Node.js $node_major found (works, but $RECOMMENDED_NODE_MAJOR is what this repo is tested against)."
else
  echo "   Node.js $node_major found."
fi

echo ""
echo "==> Checking for Docker (optional -- only needed for the CLI Sandbox tab)"
docker_ready=false
if ! command -v docker >/dev/null 2>&1; then
  echo "   Docker not found. Skipping the sandbox image build."
  echo "   Everything except the Sandbox tab (Chat/Images/Embeddings/Evaluation) works without it."
  echo "   Install from https://docs.docker.com/get-docker/ later if you want Sandbox."
elif ! docker info >/dev/null 2>&1; then
  echo "   Docker is installed but doesn't seem to be running. Skipping the sandbox image build."
  echo "   Start Docker Desktop (or dockerd) and re-run this script to build it."
else
  echo "   Docker found and running."
  docker_ready=true
fi

echo ""
echo "==> Installing dependencies (npm install)"
npm install

if [[ "$docker_ready" == true ]]; then
  echo ""
  echo "==> Building the sandbox image (sidebyside-sandbox)"
  docker build -t sidebyside-sandbox -f docker/sandbox.Dockerfile docker/
fi

echo ""
echo "✓ Setup complete."
echo ""
echo "Next steps:"
echo "  1. npm run dev"
echo "  2. open http://localhost:3000"
echo "  3. go to Settings and add your first gateway (OpenAI, Anthropic, Azure OpenAI, or Google Gemini)"
if [[ "$docker_ready" != true ]]; then
  echo ""
  echo "  (Sandbox tab needs Docker -- install it and re-run this script any time to build its image.)"
fi
