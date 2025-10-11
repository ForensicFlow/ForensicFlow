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
        Upload one or multiple files to a case with async validation and processing
        User must be assigned to the case
        
        Supports:
        - Single file: 'file' field
        - Multiple files: 'files[]' field (multiple files with same key)
        
        Returns immediately after saving files - processing happens in background
        """
        case = self.get_object()
        
        # Verify case access (double-check security)
        if not case.investigators.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You do not have permission to upload files to this case'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Handle both single and multiple file uploads
        files = request.FILES.getlist('files[]') or request.FILES.getlist('files')
        
        # Fallback to single file if no multiple files
        if not files:
            single_file = request.FILES.get('file')
            if single_file:
                files = [single_file]
        
        if not files:
            return Response(
                {'error': 'No files provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Determine file type (same for all files in batch)
        file_type = request.data.get('file_type', 'UFDR')
        uploaded_by = request.user
        
        # Process all files
        uploaded_files = []
        errors = []
        
        for file_obj in files:
            try:
                # Sanitize filename
                original_filename = FileValidator.sanitize_filename(file_obj.name)
                
                # Create CaseFile entry immediately (no blocking validation)
                case_file = CaseFile.objects.create(
                    case=case,
                    file=file_obj,
                    file_type=file_type,
                    original_filename=original_filename,
                    uploaded_by=uploaded_by,
                    processing_status='uploaded'  # Initial status
                )
                
                # Trigger async validation and processing
                from evidence.tasks import validate_and_process_file
                try:
                    # Try async first (if Celery is running)
                    validate_and_process_file.delay(case_file.id)
                    print(f"✅ Queued for async processing: {original_filename}")
                except Exception as e:
                    # If Celery not available, process synchronously
                    print(f"⚠️  Celery not available, processing synchronously: {e}")
                    try:
                        # Call function directly (without .delay) for immediate processing
                        result = validate_and_process_file(case_file.id)
                        print(f"✅ Processed synchronously: {result}")
                    except Exception as sync_error:
                        print(f"❌ Sync processing failed: {sync_error}")
                        import traceback
                        traceback.print_exc()
                        case_file.processing_status = f'failed: {str(sync_error)[:200]}'
                        case_file.save()
                
                uploaded_files.append({
                    'id': case_file.id,
                    'filename': original_filename,
                    'status': 'uploaded',
                    'message': 'File uploaded successfully, processing in background'
                })
                
            except Exception as e:
                errors.append({
                    'filename': file_obj.name,
                    'error': str(e)
                })
        
        # Return immediately with upload status
        response_data = {
            'message': f'Successfully uploaded {len(uploaded_files)} file(s)',
            'uploaded_files': uploaded_files,
            'total_uploaded': len(uploaded_files),
            'total_failed': len(errors)
        }
        
        if errors:
            response_data['errors'] = errors
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
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
    
    @action(detail=True, methods=['get'])
    def file_status(self, request, pk=None):
        """
        Get processing status of uploaded files for a case
        Returns status of all files or specific file by ID
        """
        case = self.get_object()
        
        # Verify case access
        if not case.investigators.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You do not have permission to view this case'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get specific file ID if provided
        file_id = request.query_params.get('file_id')
        
        if file_id:
            try:
                case_file = CaseFile.objects.get(id=file_id, case=case)
                serializer = CaseFileSerializer(case_file)
                return Response(serializer.data)
            except CaseFile.DoesNotExist:
                return Response(
                    {'error': 'File not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Get all files for the case
        files = CaseFile.objects.filter(case=case).order_by('-uploaded_at')
        serializer = CaseFileSerializer(files, many=True)
        
        # Group by status
        status_summary = {
            'total': files.count(),
            'uploaded': files.filter(processing_status='uploaded').count(),
            'validating': files.filter(processing_status='validating').count(),
            'processing': files.filter(processing_status='processing').count(),
            'completed': files.filter(processed=True, processing_status='completed').count(),
            'failed': files.filter(processing_status__startswith='failed').count(),
        }
        
        return Response({
            'files': serializer.data,
            'summary': status_summary
        })
    
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




