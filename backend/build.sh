#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Starting ForensicFlow build process..."

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --no-input

# Run database migrations
echo "Running database migrations..."
python manage.py migrate --no-input

# Create superuser if it doesn't exist
echo "Creating superuser..."
python manage.py shell -c "
import os
import sys
from django.contrib.auth import get_user_model

# Get environment variables
username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'forensicflow@gmail.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'Abhi@#9118')

print(f'Environment check:')
print(f'Username: {username}')
print(f'Email: {email}')
print(f'Password: {password[:4]}...' if password else 'None')

if not password:
    print('ERROR: No password provided for superuser creation')
    sys.exit(1)

User = get_user_model()

if not User.objects.filter(username=username).exists():
    print(f'Creating superuser: {username}')
    try:
        User.objects.create_superuser(username=username, email=email, password=password)
        print('Superuser created successfully')
    except Exception as e:
        print(f'ERROR creating superuser: {e}')
        sys.exit(1)
else:
    print('Superuser already exists')
"

echo "Build completed successfully!"

