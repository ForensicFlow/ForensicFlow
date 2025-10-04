"""
Custom User model with role-based access control
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model with role-based access control for ForensicFlow
    """
    
    # User Roles
    INVESTIGATOR = 'INVESTIGATOR'
    SUPERVISOR = 'SUPERVISOR'
    ADMINISTRATOR = 'ADMINISTRATOR'
    GUEST = 'GUEST'
    
    ROLE_CHOICES = [
        (INVESTIGATOR, 'Investigator Officer (IO)'),
        (SUPERVISOR, 'Supervisor / Senior Investigator'),
        (ADMINISTRATOR, 'Administrator'),
        (GUEST, 'Guest / Training User'),
    ]
    
    # Additional fields
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=INVESTIGATOR,
        help_text='User role determines access permissions'
    )
    
    employee_id = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        help_text='Employee/Officer ID'
    )
    
    department = models.CharField(
        max_length=100,
        blank=True,
        help_text='Department or division'
    )
    
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        help_text='Contact phone number'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Two-factor authentication
    two_factor_enabled = models.BooleanField(
        default=False,
        help_text='Enable two-factor authentication'
    )
    
    # Account status
    is_approved = models.BooleanField(
        default=False,
        help_text='Account approved by administrator'
    )
    
    last_login_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='Last login IP address'
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_investigator(self):
        """Check if user is an Investigator"""
        return self.role == self.INVESTIGATOR
    
    @property
    def is_supervisor(self):
        """Check if user is a Supervisor"""
        return self.role == self.SUPERVISOR
    
    @property
    def is_administrator(self):
        """Check if user is an Administrator"""
        return self.role == self.ADMINISTRATOR
    
    @property
    def is_guest(self):
        """Check if user is a Guest"""
        return self.role == self.GUEST
    
    def has_case_access(self, case):
        """
        Check if user has access to a specific case
        - Administrators: Full access
        - Supervisors: Access to all cases in their department
        - Investigators: Access to assigned cases
        - Guests: No access to real cases
        """
        if self.is_administrator:
            return True
        
        if self.is_supervisor:
            return True  # Can implement department-based filtering later
        
        if self.is_investigator:
            return case.investigators.filter(id=self.id).exists()
        
        return False
    
    def can_upload_ufdr(self):
        """Check if user can upload UFDR files"""
        return self.role in [self.INVESTIGATOR, self.SUPERVISOR, self.ADMINISTRATOR]
    
    def can_manage_users(self):
        """Check if user can manage other users"""
        return self.role == self.ADMINISTRATOR
    
    def can_approve_reports(self):
        """Check if user can approve reports"""
        return self.role in [self.SUPERVISOR, self.ADMINISTRATOR]
    
    def can_assign_cases(self):
        """Check if user can assign/reassign cases"""
        return self.role in [self.SUPERVISOR, self.ADMINISTRATOR]


class LoginHistory(models.Model):
    """
    Track user login history for security auditing
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='login_history'
    )
    
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Login status
    SUCCESS_CHOICES = [
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('BLOCKED', 'Blocked'),
    ]
    status = models.CharField(
        max_length=10,
        choices=SUCCESS_CHOICES,
        default='SUCCESS'
    )
    
    failure_reason = models.CharField(
        max_length=255,
        blank=True,
        help_text='Reason for login failure'
    )
    
    class Meta:
        ordering = ['-login_time']
        verbose_name = 'Login History'
        verbose_name_plural = 'Login Histories'
    
    def __str__(self):
        return f"{self.user.username} - {self.login_time} ({self.status})"


