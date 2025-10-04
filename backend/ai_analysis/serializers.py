"""
Serializers for AI analysis
"""
from rest_framework import serializers
from .models import Query, AIInsight, ReportItem, ChatSession, ChatMessage


class QuerySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Query
        fields = [
            'id', 'query_text', 'ai_summary', 'results_count',
            'confidence_score', 'processing_time', 'created_at',
            'user_name', 'case'
        ]
        read_only_fields = ['ai_summary', 'results_count', 'confidence_score', 'processing_time']


class AIInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIInsight
        fields = [
            'id', 'insight_type', 'title', 'description',
            'confidence', 'metadata', 'created_at', 'case'
        ]


class ReportItemSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = ReportItem
        fields = [
            'id', 'case', 'user', 'user_name', 'item_type', 'title', 'content',
            'source_query', 'evidence_ids', 'section', 'order', 'metadata',
            'pinned_at', 'updated_at'
        ]
        read_only_fields = ['pinned_at', 'updated_at']


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for individual chat messages"""
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'message_type', 'content', 'created_at',
            'evidence_ids', 'confidence_score', 'processing_time', 'metadata'
        ]
        read_only_fields = ['created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    """Serializer for chat sessions"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True, allow_null=True)
    message_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = [
            'id', 'case', 'user', 'user_name', 'title', 'created_at', 'updated_at',
            'last_message_at', 'is_active', 'message_count', 'hypothesis_mode',
            'hypothesis_text', 'message_preview'
        ]
        read_only_fields = ['created_at', 'updated_at', 'last_message_at', 'message_count']
    
    def get_message_preview(self, obj):
        """Get preview of the first user message"""
        first_message = obj.messages.filter(message_type='user').first()
        if first_message:
            return first_message.content[:100]
        return ""


class ChatSessionDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with all messages"""
    messages = ChatMessageSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = ChatSession
        fields = [
            'id', 'case', 'user', 'user_name', 'title', 'created_at', 'updated_at',
            'last_message_at', 'is_active', 'message_count', 'hypothesis_mode',
            'hypothesis_text', 'messages'
        ]
        read_only_fields = ['created_at', 'updated_at', 'last_message_at', 'message_count']

