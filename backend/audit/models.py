"""
Models for audit logging
"""
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AuditLog(models.Model):
    """
    Audit log for tracking all user actions
    """
    ACTION_TYPES = [
        ('LOGIN', 'User Login'),
        ('LOGOUT', 'User Logout'),
        ('VIEW_EVIDENCE', 'View Evidence'),
        ('EXPORT_REPORT', 'Export Report'),
        ('RUN_SEARCH', 'Run Search'),
        ('UPLOAD_FILE', 'Upload File'),
        ('CREATE_CASE', 'Create Case'),
        ('UPDATE_CASE', 'Update Case'),
        ('DELETE_EVIDENCE', 'Delete Evidence'),
        ('ADD_USER', 'Add User to Case'),
        ('REMOVE_USER', 'Remove User from Case'),
        ('INGEST_DATA', 'Ingest UFDR Data'),
        ('GENERATE_REPORT', 'Generate Report'),
    ]
    
    id = models.CharField(max_length=100, primary_key=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    details = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Optional reference to related objects
    case_id = models.CharField(max_length=100, blank=True)
    evidence_id = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['user', 'action']),
        ]
    
    def __str__(self):
        user_str = self.user.username if self.user else 'SYSTEM'
        return f"{user_str} - {self.action} at {self.timestamp}"

