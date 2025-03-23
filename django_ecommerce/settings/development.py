from .base import *
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()


SECRET_KEY = os.getenv('SECRET_KEY')

DEBUG = False


tmpPostgres = urlparse(os.getenv("DATABASE_URL"))

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


ALLOWED_HOSTS = ['.vercel.app/', 'e-commerce-django-nu.vercel.app/', "*"]