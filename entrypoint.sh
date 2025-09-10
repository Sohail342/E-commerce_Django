#!/usr/bin/env bash
set -euo pipefail

# attempt to run migrations if MIGRATE=true
if [ "${MIGRATE:-false}" = "true" ]; then
  echo "Running migrations..."
  python -m django migrate --noinput || echo "Migrate failed"
fi

# collectstatic (ignore failure in environments where static isn't configured)
echo "Collecting static files..."
python -m django collectstatic --noinput || echo "collectstatic failed"

# If you want to run another entrypoint (e.g. for debugging), support CMD override
# Default: start gunicorn with sensible default workers if not provided
: "${GUNICORN_CMD:=gunicorn -w ${WEB_CONCURRENCY:-4} -k gthread -b 0.0.0.0:8000 src.wsgi:application --timeout ${WEB_TIMEOUT:-120}}"

# Exec the command (allow overriding in compose)
exec $GUNICORN_CMD
