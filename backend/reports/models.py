"""
Models for report generation
"""
from django.db import models
from django.contrib.auth import get_user_model
from cases.models import Case

User = get_user_model()


class Report(models.Model):
    """
    Generated forensic reports
    """
    REPORT_TYPES = [
        ('summary', 'Case Summary'),
        ('evidence', 'Evidence Analysis'),
        ('timeline', 'Timeline Report'),
        ('network', 'Network Graph Analysis'),
        ('final', 'Final Investigation Report'),
    ]
    
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('docx', 'Word Document'),
        ('html', 'HTML'),
        ('json', 'JSON'),
    ]
    
    id = models.CharField(max_length=100, primary_key=True)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='reports')
    title = models.CharField(max_length=255)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='pdf')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    version = models.IntegerField(default=1)
    
    # Report content
    content = models.TextField(blank=True)
    file = models.FileField(upload_to='reports/%Y/%m/', blank=True, null=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['case', '-created_at']),
            models.Index(fields=['created_by', '-created_at']),
            models.Index(fields=['report_type']),
        ]
    
    def __str__(self):
        return f"{self.title} (v{self.version})"

