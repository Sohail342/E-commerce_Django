from .base import *
from dotenv import load_dotenv

load_dotenv()


SECRET_KEY = os.getenv('SECRET_KEY')

DEBUG = os.getenv('DEBUG')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

ALLOWED_HOSTS = ['.vercel.app/', "*"]