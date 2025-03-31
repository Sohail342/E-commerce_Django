# Docker Setup for Django E-commerce Project

This project has been containerized using Docker to provide consistent development and production environments.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Development Environment

The development environment is configured to provide hot-reloading and easy debugging.

### Starting the Development Environment

```bash
# Build and start the containers
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

### Accessing the Development Environment

- Web application: http://localhost:8000
- Database: PostgreSQL running on localhost:5432
  - Username: postgres
  - Password: postgres
  - Database: postgres

### Running Commands

```bash
# Run Django management commands
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser

# Run tests
docker-compose exec web python manage.py test
```

## Production Environment

The production environment is optimized for performance and security.

### Starting the Production Environment

```bash
# Build and start the containers
docker-compose -f docker-compose.prod.yml up --build

# Run in detached mode
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

Make sure to set the following environment variables in your `.env` file for production:

```
MODULE_ENVIRONMENT=PRODUCTION
SECRET_KEY=your_secret_key
DATABASE_URL=your_database_url
EMAIL_HOST_USER=your_email
EMAIL_HOST_PASSWORD=your_email_password
DEFAULT_FROM_EMAIL=your_default_email
```

## Docker Images

This project uses multi-stage builds to optimize the Docker images:

1. **Base Image**: Contains the Python environment and dependencies
2. **Development Image**: Extends the base image with development tools
3. **Production Image**: Optimized for production with collected static files

## Database

- For development, a PostgreSQL container is included in the docker-compose.yml file
- For production, you can either:
  - Use an external database service (recommended)
  - Uncomment the database section in docker-compose.prod.yml

## Volumes

- PostgreSQL data is persisted using a Docker volume
- In development, the application code is mounted as a volume for hot-reloading

## Troubleshooting

### Viewing Logs

```bash
# View logs for all services
docker-compose logs

# View logs for a specific service
docker-compose logs web

# Follow logs
docker-compose logs -f
```

### Restarting Services

```bash
# Restart all services
docker-compose restart

# Restart a specific service
docker-compose restart web
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop all services and remove volumes
docker-compose down -v
```