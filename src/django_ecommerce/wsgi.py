import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Get the environment setting with a default of 'production' for Vercel
environment = os.getenv('MODULE_ENVIRONMENT', 'production')

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', f'django_ecommerce.settings.{environment}')

application = get_wsgi_application()
app = application
