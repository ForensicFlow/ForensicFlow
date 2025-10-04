"""
Views for audit logs
"""
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from .models import AuditLog
from .serializers import AuditLogSerializer
from authentication.permissions import IsAuthenticatedAndApproved
from cases.models import Case


class AuditLogViewSet(mixins.ListModelMixin,
                      mixins.RetrieveModelMixin,
                      viewsets.GenericViewSet):
    """
    ViewSet for viewing audit logs (read-only) with user-specific access control
    
    Access Rules:
    - Administrators: Can view all audit logs
    - Supervisors: Can view audit logs for cases they have access to
    - Investigators: Can only view their own audit logs
    - All users: Audit logs are automatically filtered by case access
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticatedAndApproved]
    
    def get_queryset(self):
        """
        Filter audit logs based on user role and case access
        Ensures complete data isolation
        """
        user = self.request.user
        
        # Base queryset with select_related for performance
        queryset = AuditLog.objects.select_related('user')
        
        # Filter by user role
        if user.is_administrator:
            # Administrators can see all audit logs
            pass
        elif user.is_supervisor:
            # Supervisors can see audit logs for cases they have access to
            # Get all case IDs the supervisor has access to
            accessible_case_ids = Case.objects.all().values_list('id', flat=True)
            queryset = queryset.filter(
                Q(case_id__in=accessible_case_ids) | Q(user=user)
            )
        else:
            # Investigators can only see their own audit logs
            queryset = queryset.filter(user=user)
        
        # Additional filters
        user_id = self.request.query_params.get('user_id')
        if user_id:
            # Only admins can query other users' logs
            if user.is_administrator:
                queryset = queryset.filter(user_id=user_id)
            elif str(user.id) == str(user_id):
                queryset = queryset.filter(user_id=user_id)
            else:
                # Return empty queryset if trying to access other users' logs
                return AuditLog.objects.none()
        
        # Filter by action
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        # Filter by case (verify access)
        case_id = self.request.query_params.get('case_id')
        if case_id:
            try:
                case = Case.objects.get(id=case_id)
                if user.has_case_access(case):
                    queryset = queryset.filter(case_id=case_id)
                else:
                    return AuditLog.objects.none()
            except Case.DoesNotExist:
                return AuditLog.objects.none()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(timestamp__range=[start_date, end_date])
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get audit log statistics for accessible logs
        Respects user's access control
        """
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_action': dict(
                queryset.values('action').annotate(count=Count('id')).values_list('action', 'count')
            ),
            'by_user': dict(
                queryset.filter(user__isnull=False).values('user__username').annotate(
                    count=Count('id')
                ).values_list('user__username', 'count')
            )
        }
        
        return Response(stats)

