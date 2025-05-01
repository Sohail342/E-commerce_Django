from .base import *
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()


SECRET_KEY = os.getenv('SECRET_KEY')

DEBUG = False

# Replace the DATABASES section of your settings.py with this
tmpPostgres = urlparse(os.getenv("DATABASE_URL"))

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB', 'postgres'),
        'USER': os.getenv('POSTGRES_USER', 'postgres'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'postgres'),
        'HOST': 'db',  # this is the service name from docker-compose
        'PORT': '5432',
    }
}



ALLOWED_HOSTS = ['.vercel.app', os.getenv("ALLOWED_HOSTS")]


