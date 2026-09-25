#!/usr/bin/env bash
#
# Retries `terraform apply` until OCI has free-tier A1.Flex capacity, or a
# non-capacity error shows up (in which case it stops immediately -- no
# point retrying a real config/auth error).
#
# ca-toronto-1 (and most Always Free regions) only intermittently has spare
# ARM Ampere capacity; this is the standard workaround people use for OCI's
# "Out of host capacity" error on VM.Standard.A1.Flex.
#
# Usage:
#   ./retry-apply.sh
#
# Env overrides:
#   RETRY_INTERVAL_SECONDS   default: 120 (how long to wait between attempts)
#   MAX_ATTEMPTS             default: 0 (0 = retry forever until success or a
#                            non-capacity error)
#
# Runs terraform apply -auto-approve every attempt -- each retry applies
# without an interactive prompt, so only run this somewhere you can watch
# or kill (Ctrl+C stops it safely; terraform itself isn't mid-apply between
# attempts).

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

RETRY_INTERVAL_SECONDS="${RETRY_INTERVAL_SECONDS:-120}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-0}"

attempt=0
while true; do
  attempt=$((attempt + 1))
  echo "==> [$(date '+%H:%M:%S')] attempt $attempt: terraform apply -auto-approve"

  output_file="$(mktemp)"
  if terraform apply -auto-approve 2>&1 | tee "$output_file"; then
    echo ""
    echo "✓ Apply succeeded on attempt $attempt."
    rm -f "$output_file"
    exit 0
  fi

  if ! grep -q "Out of host capacity" "$output_file"; then
    echo ""
    echo "✗ Apply failed with a non-capacity error -- stopping (retrying won't help this one)." >&2
    rm -f "$output_file"
    exit 1
  fi
  rm -f "$output_file"

  if [[ "$MAX_ATTEMPTS" -gt 0 && "$attempt" -ge "$MAX_ATTEMPTS" ]]; then
    echo ""
    echo "✗ Still out of capacity after $attempt attempts (MAX_ATTEMPTS reached). Giving up." >&2
    exit 1
  fi

  echo "   still out of host capacity -- waiting ${RETRY_INTERVAL_SECONDS}s before retrying (Ctrl+C to stop)"
  sleep "$RETRY_INTERVAL_SECONDS"
done
