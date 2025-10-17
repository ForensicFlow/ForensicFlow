# Data migration to set is_approved=True for all existing users

from django.db import migrations


def approve_existing_users(apps, schema_editor):
    """Set is_approved=True for all existing users"""
    User = apps.get_model('authentication', 'User')
    updated_count = User.objects.filter(is_approved=False).update(is_approved=True)
    print(f"✅ Updated {updated_count} users to is_approved=True")


def reverse_approval(apps, schema_editor):
    """Reverse migration - set is_approved=False for all users"""
    User = apps.get_model('authentication', 'User')
    User.objects.all().update(is_approved=False)


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0004_alter_user_is_approved"),
    ]

    operations = [
        migrations.RunPython(approve_existing_users, reverse_approval),
    ]
