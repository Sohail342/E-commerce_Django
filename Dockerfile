# =========================
# Stage 1: Builder
# =========================
FROM python:3.12-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libpq-dev curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml poetry.lock* requirements.txt* ./

RUN pip install --upgrade pip setuptools wheel \
    && if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

COPY src/ ./src/

# =========================
# Stage 2: Runtime
# =========================
FROM python:3.12-slim AS runtime
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DJANGO_SETTINGS_MODULE=settings.production \
    PYTHONPATH=/app/src

RUN addgroup --system app && adduser --system --ingroup app app

# Copy installed Python packages from builder
COPY --from=builder /usr/local /usr/local

COPY --chown=app:app src/ ./src
COPY --chown=app:app entrypoint.sh ./

EXPOSE 8000
RUN chmod +x entrypoint.sh
USER app

CMD ["./entrypoint.sh"]
