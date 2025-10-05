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
python manage.py createsuperuser --noinput || true

echo "Build completed successfully!"

