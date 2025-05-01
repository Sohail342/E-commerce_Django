#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

environment = os.getenv('MODULE_ENVIRONMENT', 'development')
print("Environment:", environment)

# Always override the setting
os.environ['DJANGO_SETTINGS_MODULE'] = f'django_ecommerce.settings.{environment}'
print("DJANGO_SETTINGS_MODULE set to:", os.environ['DJANGO_SETTINGS_MODULE'])

def main():
    """Run administrative tasks."""
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
