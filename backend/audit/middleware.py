"""
Middleware for automatic audit logging
"""
from .models import AuditLog
import uuid
from datetime import datetime


class AuditMiddleware:
    """
    Middleware to automatically log user actions
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Log certain actions automatically
        if request.user.is_authenticated and request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            self.log_action(request, response)
        
        return response
    
    def log_action(self, request, response):
        """Log the action"""
        # Determine action type based on URL
        path = request.path
        
        action = None
        details = f"{request.method} {path}"
        
        if 'login' in path:
            action = 'LOGIN'
        elif 'logout' in path:
            action = 'LOGOUT'
        elif '/evidence/' in path:
            action = 'VIEW_EVIDENCE'
        elif '/reports/' in path and request.method == 'POST':
            action = 'EXPORT_REPORT'
        elif '/search/' in path or '/queries/ask/' in path:
            action = 'RUN_SEARCH'
        elif 'upload' in path:
            action = 'UPLOAD_FILE'
        
        if action:
            # Use UUID to prevent collisions on rapid actions
            log_id = str(uuid.uuid4())
            
            AuditLog.objects.create(
                id=log_id,
                user=request.user,
                action=action,
                details=details,
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
            )
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

