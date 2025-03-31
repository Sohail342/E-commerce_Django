# Nginx Configuration for Django E-commerce

This document explains how Nginx is configured to serve static and media files for the Django e-commerce application in a Docker environment.

## Overview

The setup uses Nginx as a reverse proxy to:

1. Serve static files directly from the `/app/staticfiles/` directory
2. Serve media files directly from the `/app/media/` directory
3. Proxy all other requests to the Django application

## Configuration Files

- `nginx/nginx.conf`: The Nginx configuration file
- `nginx/Dockerfile`: Dockerfile to build the Nginx image
- `docker-compose.prod.yml`: Docker Compose file for production that includes the Nginx service

## How It Works

1. The Django application collects static files to the `/app/staticfiles/` directory
2. Media files are stored in the `/app/media/` directory
3. Nginx serves these files directly, bypassing Django for better performance
4. All other requests are proxied to the Django application

## Usage

To start the application with Nginx in production mode:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

This will start:
- The Django application on port 8000 (internal only)
- Nginx on port 80 (exposed)
- PostgreSQL database (if enabled)

## Benefits

- Improved performance by serving static files directly through Nginx
- Reduced load on the Django application
- Proper caching headers for static and media files
- Production-ready setup