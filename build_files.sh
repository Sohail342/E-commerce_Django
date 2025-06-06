#!/bin/bash

# Install pip first
echo "Installing pip..."
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py 
python3.9 get-pip.py

# Build the project
echo "Building the project..."
python3.9 -m pip install python-dotenv
python3.9 -m pip install -r django_ecommerce/requirements.txt

echo "Make Migration..."
cd django_ecommerce
python3.9 manage.py makemigrations --noinput
python3.9 manage.py migrate --noinput

echo "Collect Static..."
python3.9 manage.py collectstatic --noinput --clear
cd ..