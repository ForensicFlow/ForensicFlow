"""
Admin configuration for AI analysis
"""
from django.contrib import admin
from .models import Query, AIInsight, ChatSession, ChatMessage


@admin.register(Query)
class QueryAdmin(admin.ModelAdmin):
    list_display = ['query_text', 'case', 'user', 'results_count', 'confidence_score', 'created_at']
    list_filter = ['created_at', 'case']
    search_fields = ['query_text', 'ai_summary']
    readonly_fields = ['created_at', 'processing_time']


@admin.register(AIInsight)
class AIInsightAdmin(admin.ModelAdmin):
    list_display = ['title', 'insight_type', 'case', 'confidence', 'created_at']
    list_filter = ['insight_type', 'created_at', 'case']
    search_fields = ['title', 'description']


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ['created_at', 'message_type', 'content']
    fields = ['message_type', 'content', 'created_at']
    can_delete = False


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'case', 'user', 'message_count', 'is_active', 'last_message_at']
    list_filter = ['is_active', 'hypothesis_mode', 'created_at', 'case']
    search_fields = ['title', 'hypothesis_text']
    readonly_fields = ['created_at', 'updated_at', 'last_message_at', 'message_count']
    inlines = [ChatMessageInline]
    
    fieldsets = (
        ('Session Info', {
            'fields': ('case', 'user', 'title', 'is_active')
        }),
        ('Hypothesis Mode', {
            'fields': ('hypothesis_mode', 'hypothesis_text'),
            'classes': ('collapse',)
        }),
        ('Stats', {
            'fields': ('message_count', 'created_at', 'updated_at', 'last_message_at')
        }),
    )


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'message_type', 'content_preview', 'created_at']
    list_filter = ['message_type', 'created_at']
    search_fields = ['content']
    readonly_fields = ['created_at']
    
    def content_preview(self, obj):
        return obj.content[:100] + "..." if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content'

