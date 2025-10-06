"""
Custom management command to setup database on Render
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model
import os


class Command(BaseCommand):
    help = 'Setup database and create superuser for Render deployment'

    def handle(self, *args, **options):
        self.stdout.write('Running migrations...')
        call_command('migrate', '--no-input')
        self.stdout.write(self.style.SUCCESS('✅ Migrations completed'))

        # Create superuser if doesn't exist
        User = get_user_model()
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

        if password and not User.objects.filter(username=username).exists():
            self.stdout.write(f'Creating superuser: {username}...')
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            user.is_approved = True
            user.role = 'ADMINISTRATOR'
            user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Superuser {username} created'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠️ Superuser {username} already exists or password not set'))

        self.stdout.write(self.style.SUCCESS('✅ Setup completed!'))

