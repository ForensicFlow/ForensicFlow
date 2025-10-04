# Generated manually for chat sessions

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('cases', '0001_initial'),
        ('ai_analysis', '0003_reportitem'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChatSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('last_message_at', models.DateTimeField(auto_now_add=True)),
                ('is_active', models.BooleanField(default=True)),
                ('message_count', models.IntegerField(default=0)),
                ('hypothesis_mode', models.BooleanField(default=False)),
                ('hypothesis_text', models.TextField(blank=True)),
                ('case', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chat_sessions', to='cases.case')),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name_plural': 'Chat Sessions',
                'ordering': ['-last_message_at'],
            },
        ),
        migrations.CreateModel(
            name='ChatMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message_type', models.CharField(choices=[('user', 'User Message'), ('bot', 'Bot Response'), ('system', 'System Message')], default='user', max_length=20)),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('evidence_ids', models.JSONField(blank=True, default=list)),
                ('confidence_score', models.FloatField(blank=True, null=True)),
                ('processing_time', models.FloatField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='ai_analysis.chatsession')),
            ],
            options={
                'verbose_name_plural': 'Chat Messages',
                'ordering': ['created_at'],
            },
        ),
    ]

