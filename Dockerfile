# Base Python image
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*


# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Development stage
FROM base as development

# Install development dependencies
RUN pip install --no-cache-dir watchdog

# Copy project files
COPY . .

# Production stage
FROM base as production

# Copy project files
COPY . .

# Set production environment
ENV MODULE_ENVIRONMENT=PRODUCTION

# Collect static files
RUN python manage.py collectstatic --noinput || echo "Collectstatic failed (expected in some envs)"


ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8888", "django_ecommerce.wsgi:application"]