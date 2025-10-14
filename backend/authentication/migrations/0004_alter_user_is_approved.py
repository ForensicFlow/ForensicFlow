# Generated migration to change is_approved default to True

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0003_remove_user_profile_picture"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="is_approved",
            field=models.BooleanField(
                default=True, help_text="Account approved by administrator"
            ),
        ),
    ]
