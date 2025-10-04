"""
Serializers for evidence
"""
from rest_framework import serializers
from .models import Evidence, Entity, Connection


class EntitySerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='entity_type')
    
    class Meta:
        model = Entity
        fields = ['id', 'type', 'value', 'confidence', 'metadata']


class EvidenceSerializer(serializers.ModelSerializer):
    entities = EntitySerializer(many=True, read_only=True)
    location = serializers.SerializerMethodField()
    
    class Meta:
        model = Evidence
        fields = [
            'id', 'type', 'source', 'device', 'timestamp', 'content',
            'sha256', 'confidence', 'entities', 'location', 'metadata'
        ]
    
    def get_location(self, obj):
        if obj.latitude and obj.longitude:
            return {'lat': obj.latitude, 'lon': obj.longitude}
        return None


class ConnectionSerializer(serializers.ModelSerializer):
    source = EntitySerializer(source='source_entity', read_only=True)
    target = EntitySerializer(source='target_entity', read_only=True)
    
    class Meta:
        model = Connection
        fields = ['id', 'source', 'target', 'connection_type', 'strength']

