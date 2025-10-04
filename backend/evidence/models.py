"""
Models for evidence management
"""
from django.db import models
from cases.models import Case
import json


class Evidence(models.Model):
    """
    Represents a piece of digital evidence
    """
    TYPE_CHOICES = [
        ('message', 'Message'),
        ('call', 'Call Log'),
        ('file', 'File'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('log', 'System Log'),
        ('contact', 'Contact'),
        ('location', 'Location Data'),
    ]
    
    id = models.CharField(max_length=100, primary_key=True)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='evidence_items')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    source = models.CharField(max_length=255)  # e.g., "WhatsApp", "Call Log"
    device = models.CharField(max_length=255)
    timestamp = models.DateTimeField()
    content = models.TextField()
    sha256 = models.CharField(max_length=64, blank=True)
    confidence = models.FloatField(default=1.0)
    
    # JSON field for flexible metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    # Location data
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['case', 'type']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['device']),
        ]
    
    def __str__(self):
        return f"{self.type} - {self.source} ({self.timestamp})"


class Entity(models.Model):
    """
    Extracted entities from evidence (people, places, crypto addresses, etc.)
    """
    ENTITY_TYPES = [
        ('Person', 'Person'),
        ('Phone', 'Phone Number'),
        ('Email', 'Email Address'),
        ('Crypto', 'Cryptocurrency Address'),
        ('Location', 'Location'),
        ('GPS', 'GPS Coordinates'),
        ('URL', 'URL'),
        ('IP Address', 'IP Address'),
        ('Bank Account', 'Bank Account'),
        ('Document', 'Document Reference'),
        ('Codeword', 'Codeword'),
        ('Organization', 'Organization'),
        ('Date', 'Date'),
        ('Amount', 'Amount'),
    ]
    
    evidence = models.ForeignKey(Evidence, on_delete=models.CASCADE, related_name='entities')
    entity_type = models.CharField(max_length=50, choices=ENTITY_TYPES)
    value = models.CharField(max_length=500)
    confidence = models.FloatField(default=1.0)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        verbose_name_plural = 'Entities'
        indexes = [
            models.Index(fields=['entity_type', 'value']),
        ]
    
    def __str__(self):
        return f"{self.entity_type}: {self.value}"


class Connection(models.Model):
    """
    Represents connections between entities for graph analysis
    """
    source_entity = models.ForeignKey(
        Entity, on_delete=models.CASCADE, related_name='outgoing_connections'
    )
    target_entity = models.ForeignKey(
        Entity, on_delete=models.CASCADE, related_name='incoming_connections'
    )
    connection_type = models.CharField(max_length=100)  # e.g., "communicated_with", "transferred_to"
    strength = models.FloatField(default=1.0)  # Connection strength (0-1)
    evidence_items = models.ManyToManyField(Evidence, related_name='connections')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['source_entity', 'target_entity', 'connection_type']
    
    def __str__(self):
        return f"{self.source_entity.value} -> {self.target_entity.value} ({self.connection_type})"

