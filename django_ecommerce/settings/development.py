from .base import *
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()


SECRET_KEY = os.getenv('SECRET_KEY')

DEBUG = False


ALLOWED_HOSTS = ['.vercel.app/', 'e-commerce-django-nu.vercel.app/', "*"]