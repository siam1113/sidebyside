#!/usr/bin/env bash
set -euo pipefail

mkdir -p "${CODEX_HOME:-$HOME/.codex-runtime}"

if [ -n "${CODEX_CONFIG_TOML_B64:-}" ]; then
  echo "${CODEX_CONFIG_TOML_B64}" | base64 -d > "${CODEX_HOME}/config.toml"
fi

injected_vars="$(env | grep -E '^(ANTHROPIC_|OPENAI_|COPILOT_)' | cut -d= -f1 | tr '\n' ' ' || true)"

cat <<BANNER
================================================================
 AI Gateway Sandbox
 Fresh, isolated container. No host volumes mounted -- nothing
 you do here touches your real ~/.claude, ~/.codex, or Copilot
 config/credentials.

 Tool selected: ${TOOL:-(none)}
 Gateway env vars injected: ${injected_vars:-(none)}
================================================================
BANNER

case "${TOOL:-}" in
  claude)
    echo "Run 'claude' to start."
    ;;
  codex)
    echo "Run 'codex' to start."
    ;;
  copilot)
    echo "Run 'copilot' to start."
    echo "Note: BYOK env vars above cover model calls, but Copilot CLI's own"
    echo "identity may still require 'gh auth login' first -- this is a fresh"
    echo "container, so you'll need to authenticate again each session."
    ;;
  *)
    echo "No TOOL specified (expected claude|codex|copilot)."
    ;;
esac

exec bash --rcfile /etc/sandbox-bashrc -i
