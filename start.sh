#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"; cd "$ROOT"
if [ ! -f .env ]; then echo "Missing .env; configure it before starting." >&2; exit 1; fi
set -a
# shellcheck disable=SC1091
. ./.env
set +a
BACKEND_PORT="${BACKEND_PORT:?BACKEND_PORT is required}"; FRONTEND_PORT="${FRONTEND_PORT:?FRONTEND_PORT is required}"
[ -n "${DATABASE_URL:-}" ] || { echo "DATABASE_URL is required." >&2; exit 1; }
JWT_SECRET_VALUE="${JWT_SECRET:-}"; [ "${#JWT_SECRET_VALUE}" -ge 32 ] || { echo "JWT_SECRET must contain at least 32 characters." >&2; exit 1; }
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-${CORS_ORIGINS:-${CORS_ORIGIN:-}}}"
if [ -z "$ALLOWED_ORIGINS" ]; then
  if [ "${NODE_ENV:-development}" != production ]; then ALLOWED_ORIGINS="http://127.0.0.1:$FRONTEND_PORT"; else echo "ALLOWED_ORIGINS is required." >&2; exit 1; fi
fi
export ALLOWED_ORIGINS
if [ ! -d backend/node_modules ] || [ ! -d web/node_modules ]; then echo "Dependencies missing; run scripts/bootstrap.sh explicitly." >&2; exit 1; fi
if [ "${BOOTSTRAP_ACKNOWLEDGEMENT:-}" = "create-initial-admin" ]; then
  npm --prefix backend run create-admin
fi
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do if command -v lsof >/dev/null && lsof -ti ":$port" >/dev/null 2>&1; then echo "Port $port is already in use." >&2; exit 1; fi; done
(cd backend && node server.js) & BACKEND_PID=$!
(cd web && PORT="$FRONTEND_PORT" REACT_APP_API_URL="http://127.0.0.1:$BACKEND_PORT" BROWSER=none npm start) & FRONTEND_PID=$!
cleanup() { kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true; wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true; }; trap cleanup EXIT INT TERM
wait "$BACKEND_PID" "$FRONTEND_PID"
