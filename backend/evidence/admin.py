"""
Admin configuration for evidence
"""
from django.contrib import admin
from .models import Evidence, Entity, Connection


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ['id', 'type', 'source', 'device', 'timestamp', 'case']
    list_filter = ['type', 'case', 'timestamp']
    search_fields = ['content', 'source', 'device', 'sha256']
    date_hierarchy = 'timestamp'


@admin.register(Entity)
class EntityAdmin(admin.ModelAdmin):
    list_display = ['entity_type', 'value', 'confidence', 'evidence']
    list_filter = ['entity_type', 'confidence']
    search_fields = ['value']


@admin.register(Connection)
class ConnectionAdmin(admin.ModelAdmin):
    list_display = ['source_entity', 'target_entity', 'connection_type', 'strength']
    list_filter = ['connection_type']

