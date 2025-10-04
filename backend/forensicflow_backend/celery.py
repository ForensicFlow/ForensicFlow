"""
Celery configuration for asynchronous tasks
"""
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'forensicflow_backend.settings')

app = Celery('forensicflow_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

