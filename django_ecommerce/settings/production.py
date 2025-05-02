from .base import *
from dotenv import load_dotenv
from urllib.parse import urlparse
import os

load_dotenv()


DEBUG = False

# Replace the DATABASES section of your settings.py with this
tmpPostgres = urlparse(os.getenv("DATABASE_URL"))
if os.getenv("DATABASE_URL"):
    DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': tmpPostgres.path.replace('/', ''),
        'USER': tmpPostgres.username,
        'PASSWORD': tmpPostgres.password,
        'HOST': tmpPostgres.hostname,
        'PORT': 5432,
    }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('POSTGRES_DB', 'postgres'),
            'USER': os.getenv('POSTGRES_USER', 'postgres'),
            'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'postgres'),
            'HOST': os.getenv('POSTGRES_HOST', 'localhost'),
            'PORT': '5432',
        }
    }

FORCE_SCRIPT_NAME = '/zevaristan'
STATIC_URL = '/zevaristan/static/'
MEDIA_URL = '/zevaristan/media/'

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


ALLOWED_HOSTS = ['.vercel.app', os.getenv("ALLOWED_HOSTS")]


