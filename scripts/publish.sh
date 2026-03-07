#!/bin/bash

set -euo pipefail

# Route the legacy publish entrypoint to the maintained API pipeline.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ "${1:-}" == "" || "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Content Publisher publish entrypoint

This command uses the maintained API workflow:
  bun scripts/publish-wechat.ts <article.md|article.html> [options]

Examples:
  npm run publish -- article.md --dry-run
  npm run publish -- article.md --author "小试AI" --cover cover.png --theme wechat-anthropic

Prerequisites:
  1. ~/.content-publisher/.env contains WECHAT_APP_ID and WECHAT_APP_SECRET
  2. Your outbound IP is added to the WeChat Official Account whitelist
EOF
  exit 0
fi

exec bun "${SCRIPT_DIR}/publish-wechat.ts" "$@"
