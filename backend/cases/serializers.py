"""
Serializers for case management
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Case, CaseFile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class CaseFileSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    
    class Meta:
        model = CaseFile
        fields = [
            'id', 'file', 'file_type', 'original_filename',
            'uploaded_at', 'uploaded_by', 'processed', 'processing_status'
        ]


class CaseSerializer(serializers.ModelSerializer):
    investigators = UserSerializer(many=True, read_only=True)
    investigator_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), 
        write_only=True, required=False
    )
    evidence_count = serializers.IntegerField(read_only=True)
    files = CaseFileSerializer(many=True, read_only=True)
    last_modified = serializers.DateTimeField(source='updated_at', read_only=True)
    # Convert id to string for frontend compatibility
    id = serializers.SerializerMethodField()
    
    def get_id(self, obj):
        """Return id as string for frontend compatibility"""
        return str(obj.id)
    
    class Meta:
        model = Case
        fields = [
            'id', 'case_id', 'name', 'description', 'status', 'case_number',
            'created_at', 'updated_at', 'last_modified',
            'investigators', 'investigator_ids', 'evidence_count', 'files'
        ]
        read_only_fields = ['id', 'case_id', 'case_number', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create a new case with auto-generated ID and case number"""
        try:
            investigator_ids = validated_data.pop('investigator_ids', [])
            case = Case.objects.create(**validated_data)
            if investigator_ids:
                case.investigators.set(investigator_ids)
            return case
        except Exception as e:
            raise serializers.ValidationError({
                'detail': f'Failed to create case: {str(e)}'
            })
    
    def update(self, instance, validated_data):
        investigator_ids = validated_data.pop('investigator_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if investigator_ids is not None:
            instance.investigators.set(investigator_ids)
        
        return instance

