"""
Models for AI analysis and queries
"""
from django.db import models
from django.contrib.auth import get_user_model
from cases.models import Case

User = get_user_model()


class Query(models.Model):
    """
    Stores natural language queries made by investigators
    """
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='queries')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    query_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # AI Response
    ai_summary = models.TextField(blank=True)
    processing_time = models.FloatField(null=True, blank=True)  # in seconds
    
    # Results metadata
    results_count = models.IntegerField(default=0)
    confidence_score = models.FloatField(default=0.0)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Queries'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['case', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.query_text[:50]}... ({self.created_at})"


class AIInsight(models.Model):
    """
    Stores AI-generated insights about cases
    """
    INSIGHT_TYPES = [
        ('pattern', 'Pattern Detection'),
        ('anomaly', 'Anomaly Detection'),
        ('connection', 'Connection Discovery'),
        ('timeline', 'Timeline Analysis'),
        ('entity', 'Entity Analysis'),
    ]
    
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='ai_insights')
    insight_type = models.CharField(max_length=50, choices=INSIGHT_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    confidence = models.FloatField(default=0.0)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['case', '-created_at']),
            models.Index(fields=['insight_type']),
        ]
    
    def __str__(self):
        return f"{self.insight_type}: {self.title}"


class ReportItem(models.Model):
    """
    Stores items pinned to case reports by investigators
    Allows building reports while exploring data
    """
    ITEM_TYPES = [
        ('ai_response', 'AI Response'),
        ('evidence', 'Evidence Item'),
        ('insight', 'AI Insight'),
        ('note', 'Investigator Note'),
    ]
    
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='report_items')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    # Item metadata
    item_type = models.CharField(max_length=50, choices=ITEM_TYPES)
    title = models.CharField(max_length=255)
    content = models.TextField()
    
    # Source tracking for evidence chain
    source_query = models.ForeignKey(Query, on_delete=models.SET_NULL, null=True, blank=True)
    evidence_ids = models.JSONField(default=list, blank=True)  # List of related evidence IDs
    
    # Organization
    section = models.CharField(max_length=100, default='findings')  # findings, evidence, timeline, etc.
    order = models.IntegerField(default=0)  # For ordering within sections
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)  # Additional context
    pinned_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['section', 'order', '-pinned_at']
        verbose_name_plural = 'Report Items'
        indexes = [
            models.Index(fields=['case', 'section', 'order']),
            models.Index(fields=['case', '-pinned_at']),
            models.Index(fields=['user', '-pinned_at']),
        ]
    
    def __str__(self):
        return f"{self.item_type}: {self.title[:50]}"


class ChatSession(models.Model):
    """
    Stores FlowBot chat sessions for a case
    Each session represents a conversation thread
    """
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='chat_sessions')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    # Session metadata
    title = models.CharField(max_length=255, blank=True)  # AI-generated summary
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_message_at = models.DateTimeField(auto_now_add=True)
    
    # Session state
    is_active = models.BooleanField(default=True)
    message_count = models.IntegerField(default=0)
    
    # Hypothesis mode tracking
    hypothesis_mode = models.BooleanField(default=False)
    hypothesis_text = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-last_message_at']
        verbose_name_plural = 'Chat Sessions'
        indexes = [
            models.Index(fields=['case', '-last_message_at']),
            models.Index(fields=['user', '-last_message_at']),
            models.Index(fields=['case', 'is_active', '-last_message_at']),
        ]
    
    def __str__(self):
        return f"{self.title or 'Chat Session'} - {self.case.name}"


class ChatMessage(models.Model):
    """
    Stores individual messages within a chat session
    """
    MESSAGE_TYPES = [
        ('user', 'User Message'),
        ('bot', 'Bot Response'),
        ('system', 'System Message'),
    ]
    
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='user')
    
    # Message content
    content = models.TextField()
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Bot response metadata
    evidence_ids = models.JSONField(default=list, blank=True)  # Related evidence
    confidence_score = models.FloatField(null=True, blank=True)
    processing_time = models.FloatField(null=True, blank=True)  # in seconds
    
    # Additional data (for embedded components, suggested followups, etc.)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name_plural = 'Chat Messages'
    
    def __str__(self):
        return f"{self.message_type}: {self.content[:50]}..."

