"""
Serializers for audit logs
"""
from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'timestamp', 'user', 'user_name', 'action',
            'details', 'ip_address', 'case_id', 'evidence_id'
        ]
        read_only_fields = ['timestamp']

