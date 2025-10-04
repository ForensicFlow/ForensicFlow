"""
Views for case management
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from django.db.models import Q
from .models import Case, CaseFile
from .serializers import CaseSerializer, CaseFileSerializer
from evidence.tasks import process_ufdr_file
from evidence.file_validator import FileValidator
from authentication.permissions import IsAuthenticatedAndApproved, IsOwnerOnly
import os


class CaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing forensic cases with STRICT user-specific access control
    
    Access Rules:
    - ALL USERS: Can only access cases where they are assigned as investigators
    - NO CROSS-USER ACCESS: Each user sees only their own cases
    - Complete data isolation enforced
    """
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticatedAndApproved, IsOwnerOnly]
    
    def get_queryset(self):
        """
        STRICT ISOLATION: Each user sees only their own cases
        No role-based exceptions - everyone sees only cases they're assigned to
        """
        user = self.request.user
        
        # ALL users (including admins/supervisors) see only their assigned cases
        return Case.objects.filter(
            investigators=user
        ).prefetch_related('investigators').distinct()
    
    def create(self, request, *args, **kwargs):
        """
        Create a new case with improved error handling
        Automatically assigns the creator as the ONLY investigator
        """
        try:
            response = super().create(request, *args, **kwargs)
            
            # Automatically assign ONLY the creator to the case
            if response.status_code == status.HTTP_201_CREATED:
                case_id = response.data.get('id')
                case = Case.objects.get(id=case_id)
                # Clear any existing investigators and add only the creator
                case.investigators.clear()
                case.investigators.add(request.user)
            
            return response
        except IntegrityError as e:
            return Response(
                {'detail': 'A case with this information already exists. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'detail': f'Failed to create case: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_create(self, serializer):
        """Save the case"""
        serializer.save()
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete a case (only owner can delete)
        """
        case = self.get_object()
        
        # Verify user is owner
        if not case.investigators.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You do not have permission to delete this case'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        case_name = case.name
        case_number = case.case_number
        
        # Delete the case (cascade will delete related data)
        case.delete()
        
        return Response(
            {
                'message': f'Case "{case_name}" ({case_number}) has been permanently deleted',
                'deleted': True
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def mark_active(self, request, pk=None):
        """
        Mark a case as Active
        POST /api/cases/{id}/mark_active/
        """
        case = self.get_object()
        
        # Verify user is owner
        if not case.investigators.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You do not have permission to modify this case'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        case.status = 'Active'
        case.save()
        
        serializer = self.get_serializer(case)
        return Response({
            'message': f'Case "{case.name}" marked as Active',
            'case': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_closed(self, request, pk=None):
        """
        Mark a case as Closed
        POST /api/cases/{id}/mark_closed/
        """
        case = self.get_object()
        
        # Verify user is owner
        if not case.investigators.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You do not have permission to modify this case'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        case.status = 'Closed'
        case.save()
        
        serializer = self.get_serializer(case)
        return Response({
            'message': f'Case "{case.name}" marked as Closed',
            'case': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_archived(self, request, pk=None):
        """
        Mark a case as Archived
        POST /api/cases/{id}/mark_archived/
        """
        case = self.get_object()
        
        # Verify user is owner
        if not case.investigators.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You do not have permission to modify this case'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        case.status = 'Archived'
        case.save()
        
        serializer = self.get_serializer(case)
        return Response({
            'message': f'Case "{case.name}" marked as Archived',
            'case': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """
        Change case status to any valid status
        POST /api/cases/{id}/change_status/
        Body: {"status": "Active|Closed|Archived"}
        """
        case = self.get_object()
        
        # Verify user is owner
        if not case.investigators.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You do not have permission to modify this case'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        
        # Validate status
        valid_statuses = ['Active', 'Closed', 'Archived']
        if new_status not in valid_statuses:
            return Response(
                {
                    'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}',
                    'valid_statuses': valid_statuses
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = case.status
        case.status = new_status
        case.save()
        
        serializer = self.get_serializer(case)
        return Response({
            'message': f'Case status changed from {old_status} to {new_status}',
            'old_status': old_status,
            'new_status': new_status,
            'case': serializer.data
        })
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_file(self, request, pk=None):
        """
        Upload a UFDR or other file to a case with validation
        User must be assigned to the case
        """
        case = self.get_object()
        
        # Verify case access (double-check security)
        if not case.investigators.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You do not have permission to upload files to this case'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Sanitize filename
        original_filename = FileValidator.sanitize_filename(file_obj.name)
        
        # Determine file type
        file_type = request.data.get('file_type', 'UFDR')
        
        # Record uploader
        uploaded_by = request.user
        
        # Create CaseFile entry (save temporarily for validation)
        case_file = CaseFile.objects.create(
            case=case,
            file=file_obj,
            file_type=file_type,
            original_filename=original_filename,
            uploaded_by=uploaded_by
        )
        
        # Validate the uploaded file
        file_path = case_file.file.path
        is_valid, error_message = FileValidator.validate_file(file_path, original_filename)
        
        if not is_valid:
            # Delete the invalid file
            case_file.delete()
            return Response(
                {
                    'error': 'File validation failed',
                    'detail': error_message
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get file info
        file_info = FileValidator.get_file_info(file_path)
        case_file.processing_status = f"validated: {file_info.get('size_mb', 0)}MB"
        case_file.save()
        
        # Process UFDR files
        if file_type == 'UFDR':
            try:
                # Try async processing with Celery first
                process_ufdr_file.delay(case_file.id)
            except Exception as e:
                # If Celery is not available, process synchronously
                print(f"Celery not available, processing synchronously: {e}")
                import traceback
                try:
                    from evidence.tasks import process_ufdr_file as sync_process
                    # Call the function directly (synchronously)
                    result = sync_process(case_file.id)
                    print(f"Sync processing result: {result}")
                except Exception as sync_error:
                    error_trace = traceback.format_exc()
                    print(f"Error in sync processing: {sync_error}")
                    print(f"Full traceback:\n{error_trace}")
                    # Store detailed error in processing status
                    case_file.processing_status = f'failed: {str(sync_error)[:200]}'
                    case_file.save()
        
        serializer = CaseFileSerializer(case_file)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def evidence(self, request, pk=None):
        """
        Get all evidence for a case
        User must be assigned to the case
        """
        case = self.get_object()
        evidence_items = case.evidence_items.all()
        
        from evidence.serializers import EvidenceSerializer
        serializer = EvidenceSerializer(evidence_items, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get case statistics for cases the user has access to
        STRICT ISOLATION - users only see stats for their own cases
        """
        # Get user-specific queryset
        queryset = self.get_queryset()
        
        total_cases = queryset.count()
        active_cases = queryset.filter(status='Active').count()
        closed_cases = queryset.filter(status='Closed').count()
        archived_cases = queryset.filter(status='Archived').count()
        
        return Response({
            'total': total_cases,
            'active': active_cases,
            'closed': closed_cases,
            'archived': archived_cases
        })

