"""
Serializers for reports
"""
from rest_framework import serializers
from .models import Report
from cases.serializers import UserSerializer


class ReportSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    case_name = serializers.CharField(source='case.name', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'title', 'report_type', 'format', 'case', 'case_name',
            'created_by', 'created_by_name', 'created_at', 'version',
            'content', 'file', 'metadata'
        ]
        read_only_fields = ['created_at', 'file']

