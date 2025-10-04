"""
Views for report generation
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Report
from .serializers import ReportSerializer
from .report_generator import ReportGenerator
from cases.models import Case
from authentication.permissions import IsAuthenticatedAndApproved, IsCaseInvestigatorOrAbove


class ReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reports with user-specific access control
    """
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticatedAndApproved, IsCaseInvestigatorOrAbove]
    
    def get_queryset(self):
        """
        Filter reports based on user's case access
        Ensures complete data isolation - users only see reports from cases they have access to
        """
        user = self.request.user
        
        # Base queryset with select_related for performance
        queryset = Report.objects.select_related('case', 'created_by')
        
        # Filter by user's case access
        if user.is_administrator or user.is_supervisor:
            # Admins and supervisors see all reports
            pass
        else:
            # Investigators see only reports from assigned cases
            queryset = queryset.filter(case__investigators=user)
        
        # Additional filter by case_id if provided
        case_id = self.request.query_params.get('case_id')
        if case_id:
            # Verify user has access to this case
            try:
                case = Case.objects.get(id=case_id)
                if not user.has_case_access(case):
                    return Report.objects.none()
                queryset = queryset.filter(case_id=case_id)
            except Case.DoesNotExist:
                return Report.objects.none()
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate a new report
        """
        case_id = request.data.get('case_id')
        report_type = request.data.get('report_type', 'summary')
        title = request.data.get('title')
        format_type = request.data.get('format', 'pdf')
        
        if not case_id:
            return Response(
                {'error': 'Case ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            case = Case.objects.get(id=case_id)
            # Verify user has access to this case
            if not request.user.has_case_access(case):
                return Response(
                    {'error': 'You do not have access to this case'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate report
        generator = ReportGenerator(case)
        report_data = generator.generate(report_type, format_type)
        
        # Create report record
        report = Report.objects.create(
            id=f"{case_id}_rep_{Report.objects.filter(case=case).count() + 1}",
            case=case,
            title=title or f"{report_type.title()} Report - {case.name}",
            report_type=report_type,
            format=format_type,
            created_by=request.user,
            content=report_data.get('content', ''),
            metadata=report_data.get('metadata', {})
        )
        
        serializer = self.get_serializer(report)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """
        Export report in specified format
        """
        report = self.get_object()
        
        # Return file if exists
        if report.file:
            return Response({
                'file_url': report.file.url
            })
        
        # Otherwise return content
        return Response({
            'content': report.content,
            'format': report.format
        })

