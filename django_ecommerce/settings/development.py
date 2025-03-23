from .base import *
from dotenv import load_dotenv

load_dotenv()


SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']

