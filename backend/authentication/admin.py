"""
Admin configuration for authentication app
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, LoginHistory


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom User admin
    """
    list_display = [
        'username', 'email', 'first_name', 'last_name',
        'role', 'is_approved', 'is_active', 'date_joined'
    ]
    list_filter = ['role', 'is_approved', 'is_active', 'two_factor_enabled', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'employee_id']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role & Permissions', {
            'fields': ('role', 'is_approved')
        }),
        ('Additional Information', {
            'fields': ('employee_id', 'department', 'phone_number')
        }),
        ('Security', {
            'fields': ('two_factor_enabled', 'last_login_ip')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role & Permissions', {
            'fields': ('role', 'is_approved')
        }),
        ('Additional Information', {
            'fields': ('employee_id', 'department', 'phone_number', 'email')
        }),
    )
    
    actions = ['approve_users', 'deactivate_users']
    
    def approve_users(self, request, queryset):
        """Approve selected users"""
        updated = queryset.update(is_approved=True)
        self.message_user(request, f'{updated} users approved successfully.')
    approve_users.short_description = 'Approve selected users'
    
    def deactivate_users(self, request, queryset):
        """Deactivate selected users"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users deactivated.')
    deactivate_users.short_description = 'Deactivate selected users'


@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    """
    Login History admin
    """
    list_display = [
        'user', 'login_time', 'logout_time',
        'ip_address', 'status'
    ]
    list_filter = ['status', 'login_time']
    search_fields = ['user__username', 'ip_address']
    readonly_fields = [
        'user', 'login_time', 'logout_time',
        'ip_address', 'user_agent', 'status', 'failure_reason'
    ]
    
    def has_add_permission(self, request):
        """Disable manual creation"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Make read-only"""
        return False


