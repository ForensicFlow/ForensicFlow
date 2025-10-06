"""
Management command to create admin user
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os


class Command(BaseCommand):
    help = 'Create admin superuser if it does not exist'

    def handle(self, *args, **options):
        User = get_user_model()
        
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'forensicflow@gmail.com')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
        
        if not password:
            self.stdout.write(self.style.ERROR('❌ DJANGO_SUPERUSER_PASSWORD not set'))
            return
        
        # Check if user exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'User {username} already exists. Updating...'))
            user = User.objects.get(username=username)
            user.set_password(password)  # Update password
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.is_approved = True  # CRITICAL!
            user.role = 'ADMINISTRATOR'
            user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Updated user: {username}'))
        else:
            self.stdout.write(self.style.WARNING(f'Creating superuser: {username}'))
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            user.is_approved = True  # CRITICAL!
            user.role = 'ADMINISTRATOR'
            user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Created superuser: {username}'))
        
        # Verify
        self.stdout.write(self.style.SUCCESS('─' * 50))
        self.stdout.write(f'Username: {user.username}')
        self.stdout.write(f'Email: {user.email}')
        self.stdout.write(f'is_staff: {user.is_staff}')
        self.stdout.write(f'is_superuser: {user.is_superuser}')
        self.stdout.write(f'is_active: {user.is_active}')
        self.stdout.write(f'is_approved: {user.is_approved}')
        self.stdout.write(f'role: {user.role}')
        self.stdout.write(self.style.SUCCESS('─' * 50))

