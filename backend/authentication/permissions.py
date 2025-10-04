"""
Role-based permission classes for ForensicFlow
"""
from rest_framework import permissions


class IsAdministrator(permissions.BasePermission):
    """
    Permission class for Administrator role only
    """
    message = "Only administrators can perform this action."
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_administrator
        )


class IsSupervisor(permissions.BasePermission):
    """
    Permission class for Supervisor role or above
    """
    message = "Only supervisors can perform this action."
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['SUPERVISOR', 'ADMINISTRATOR']
        )


class IsInvestigator(permissions.BasePermission):
    """
    Permission class for Investigator role or above (excludes Guest)
    """
    message = "Only investigators can perform this action."
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['INVESTIGATOR', 'SUPERVISOR', 'ADMINISTRATOR']
        )


class IsNotGuest(permissions.BasePermission):
    """
    Permission class to exclude Guest users
    """
    message = "Guest users cannot perform this action."
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role != 'GUEST'
        )


class CanUploadUFDR(permissions.BasePermission):
    """
    Permission class for UFDR file upload
    """
    message = "You do not have permission to upload UFDR files."
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.can_upload_ufdr()
        )


class CanManageUsers(permissions.BasePermission):
    """
    Permission class for user management
    """
    message = "Only administrators can manage users."
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.can_manage_users()
        )


class CanApproveReports(permissions.BasePermission):
    """
    Permission class for report approval
    """
    message = "Only supervisors can approve reports."
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.can_approve_reports()
        )


class CanAssignCases(permissions.BasePermission):
    """
    Permission class for case assignment
    """
    message = "Only supervisors can assign cases."
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.can_assign_cases()
        )


class IsAccountApproved(permissions.BasePermission):
    """
    Permission class to check if user account is approved
    """
    message = "Your account is pending approval by an administrator."
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_approved or request.user.is_superuser)
        )


class HasCaseAccess(permissions.BasePermission):
    """
    Permission class for case-level access control
    """
    message = "You do not have access to this case."
    
    def has_object_permission(self, request, view, obj):
        # Administrators have access to all cases
        if request.user.is_administrator:
            return True
        
        # Supervisors have access to all cases
        if request.user.is_supervisor:
            return True
        
        # Investigators have access to assigned cases
        if hasattr(obj, 'investigators'):
            return obj.investigators.filter(id=request.user.id).exists()
        
        # For evidence objects, check parent case
        if hasattr(obj, 'case'):
            return obj.case.investigators.filter(id=request.user.id).exists()
        
        return False


class ReadOnlyForGuest(permissions.BasePermission):
    """
    Permission class that allows read-only access for guests
    """
    message = "Guest users have read-only access."
    
    def has_permission(self, request, view):
        # Allow read operations for guests
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write operations not allowed for guests
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role != 'GUEST'
        )


class HasCaseAccessFromQueryParam(permissions.BasePermission):
    """
    Permission class to check case access from query parameter 'case_id'
    Used for list views that filter by case
    """
    message = "You do not have access to this case."
    
    def has_permission(self, request, view):
        # Require authentication
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Get case_id from query params or request data
        case_id = request.query_params.get('case_id') or request.data.get('case_id')
        
        # If no case_id provided, administrators and supervisors can see all
        if not case_id:
            return request.user.is_administrator or request.user.is_supervisor
        
        # Check case access
        from cases.models import Case
        try:
            case = Case.objects.get(id=case_id)
            return request.user.has_case_access(case)
        except Case.DoesNotExist:
            return False


class IsAuthenticatedAndApproved(permissions.BasePermission):
    """
    Combined permission: user must be authenticated and approved
    """
    message = "Authentication required and account must be approved."
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_approved or request.user.is_superuser)
        )


class IsOwnerOnly(permissions.BasePermission):
    """
    STRICT ISOLATION: Each user can only access their own data
    No role-based exceptions - everyone sees only their own data
    """
    message = "You can only access your own data."
    
    def has_permission(self, request, view):
        # Must be authenticated and approved
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not (request.user.is_approved or request.user.is_superuser):
            return False
        
        # Allow create action for all authenticated users
        if hasattr(view, 'action') and view.action == 'create':
            return True
        
        # Allow list action (will be filtered by get_queryset)
        return True
    
    def has_object_permission(self, request, view, obj):
        # User can only access their own objects
        # Check through various object types
        
        # Case object - check if user is in investigators
        if hasattr(obj, 'investigators'):
            return obj.investigators.filter(id=request.user.id).exists()
        
        # Objects with 'user' field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Objects with 'created_by' field
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        # Objects with 'uploaded_by' field  
        if hasattr(obj, 'uploaded_by'):
            return obj.uploaded_by == request.user
        
        # For evidence, check through case
        if hasattr(obj, 'case'):
            return obj.case.investigators.filter(id=request.user.id).exists()
        
        # For entities, check through evidence
        if hasattr(obj, 'evidence'):
            return obj.evidence.case.investigators.filter(id=request.user.id).exists()
        
        return False


class IsCaseInvestigatorOrAbove(permissions.BasePermission):
    """
    Permission class that checks if user is assigned to a case or is supervisor/admin
    Works with both object permission and request case_id parameter
    Allows investigators to create new cases
    """
    message = "You must be assigned to this case to perform this action."
    
    def has_permission(self, request, view):
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins and supervisors always have access
        if request.user.is_administrator or request.user.is_supervisor:
            return True
        
        # Allow investigators to create cases (no case_id exists yet)
        # This is critical - investigators need to create cases!
        if hasattr(view, 'action') and view.action == 'create':
            return request.user.role in ['INVESTIGATOR', 'SUPERVISOR', 'ADMINISTRATOR']
        
        # For other actions, check if case_id is provided
        case_id = request.query_params.get('case_id') or request.data.get('case_id')
        if case_id:
            from cases.models import Case
            try:
                case = Case.objects.get(id=case_id)
                return case.investigators.filter(id=request.user.id).exists()
            except Case.DoesNotExist:
                return False
        
        # If no case_id and not a create action, allow investigators to list their cases
        # This allows investigators to see the list view (filtered by get_queryset)
        return request.user.role in ['INVESTIGATOR', 'SUPERVISOR', 'ADMINISTRATOR']
    
    def has_object_permission(self, request, view, obj):
        # Admins and supervisors always have access
        if request.user.is_administrator or request.user.is_supervisor:
            return True
        
        # Check case access through various object types
        if hasattr(obj, 'investigators'):  # Case object
            return obj.investigators.filter(id=request.user.id).exists()
        
        if hasattr(obj, 'case'):  # Evidence, Query, Report, etc.
            return obj.case.investigators.filter(id=request.user.id).exists()
        
        if hasattr(obj, 'evidence'):  # Entity object
            return obj.evidence.case.investigators.filter(id=request.user.id).exists()
        
        return False


