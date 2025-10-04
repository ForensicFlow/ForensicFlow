"""
Models for case management
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Case(models.Model):
    """
    Represents a forensic investigation case
    """
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Closed', 'Closed'),
        ('Archived', 'Archived'),
    ]
    
    # Use default Django AutoField for primary key (id will be auto-generated as integer)
    # case_id is the user-facing unique identifier
    case_id = models.CharField(max_length=100, unique=True, editable=False, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    investigators = models.ManyToManyField(User, related_name='cases')
    case_number = models.CharField(max_length=100, unique=True, editable=False, blank=True)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['-updated_at']),
            models.Index(fields=['status']),
            models.Index(fields=['case_number']),
        ]
    
    def save(self, *args, **kwargs):
        """Generate case_id and case_number if not set"""
        if not self.case_id:
            # Generate unique case ID using UUID
            self.case_id = f"case-{uuid.uuid4().hex[:12]}"
        
        if not self.case_number:
            # Generate case number with year and unique code
            from datetime import datetime
            year = datetime.now().year
            unique_code = uuid.uuid4().hex[:8].upper()
            
            # Ensure uniqueness by checking database
            case_number = f"FIR-{year}-{unique_code}"
            counter = 1
            while Case.objects.filter(case_number=case_number).exists():
                unique_code = uuid.uuid4().hex[:8].upper()
                case_number = f"FIR-{year}-{unique_code}"
                counter += 1
                if counter > 10:  # Safety limit
                    raise ValueError("Unable to generate unique case number")
            
            self.case_number = case_number
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.case_number}: {self.name}"
    
    @property
    def evidence_count(self):
        return self.evidence_items.count()


class CaseFile(models.Model):
    """
    Files associated with a case (UFDRs, reports, etc.)
    """
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='case_files/%Y/%m/%d/')
    file_type = models.CharField(max_length=50)  # UFDR, PDF, Image, etc.
    original_filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    processed = models.BooleanField(default=False)
    processing_status = models.CharField(max_length=50, default='pending')
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.original_filename} - {self.case.name}"

