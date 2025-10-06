#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Starting ForensicFlow build process..."

# Navigate to backend directory
cd backend

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
print(f'Password: {\"***\" if password else \"None\"}')

if not password:
    print('ERROR: No password provided for superuser creation')
    sys.exit(1)

User = get_user_model()

if not User.objects.filter(username=username).exists():
    print(f'Creating superuser: {username}')
    try:
        # Create superuser with proper attributes for custom User model
        user = User.objects.create_superuser(
            username=username, 
            email=email, 
            password=password
        )
        # Set required custom fields
        user.is_approved = True  # Critical: Custom User model requires this
        user.role = 'ADMINISTRATOR'  # Set role to ADMINISTRATOR
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save()
        print(f'Superuser created successfully: {username}')
        print(f'  - Email: {email}')
        print(f'  - Role: ADMINISTRATOR')
        print(f'  - Approved: True')
    except Exception as e:
        print(f'ERROR creating superuser: {e}')
        import traceback
        traceback.print_exc()
        # Don't exit with error - allow build to continue
        print('Warning: Superuser creation failed, but continuing build...')
else:
    print(f'Superuser already exists: {username}')
    # Update existing superuser to ensure proper settings
    try:
        user = User.objects.get(username=username)
        user.is_approved = True
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        if not user.role:
            user.role = 'ADMINISTRATOR'
        user.save()
        print(f'Superuser updated with correct settings')
    except Exception as e:
        print(f'Warning: Could not update superuser: {e}')
"

echo "Build completed successfully!"

