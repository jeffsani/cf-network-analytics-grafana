#!/usr/bin/env bash
# Produces a portable dashboard JSON with the account tag cleared.
# Output: cloudflare-network-analytics.json in the current directory.

set -euo pipefail

SRC="container/provisioning/dashboards/cloudflare-network-analytics.json"
OUT="cloudflare-network-analytics.json"

jq '
  (.templating.list[] | select(.name == "accountTag")) |=
    (.current = {"selected": false, "text": "", "value": ""} | .query = "")
' "$SRC" > "$OUT"

echo "Exported portable dashboard to $OUT"
