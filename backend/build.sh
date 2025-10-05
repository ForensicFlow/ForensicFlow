#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Run database migrations
python manage.py migrate --no-input

# Create superuser if it doesn't exist
echo "Creating superuser..."
python manage.py shell -c "
import os
from django.contrib.auth import get_user_model
User = get_user_model()

username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'forensicflow@gmail.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

if not User.objects.filter(username=username).exists():
    print(f'Creating superuser: {username}')
    User.objects.create_superuser(username=username, email=email, password=password)
    print('Superuser created successfully')
else:
    print('Superuser already exists')
"

echo "Build completed successfully!"

