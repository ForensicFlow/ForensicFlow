"""
Views for authentication
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import logout
from django.utils import timezone
from .models import User, LoginHistory
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserListSerializer,
    UserManagementSerializer,
    ChangePasswordSerializer,
    LoginHistorySerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from .permissions import IsAdministrator, CanManageUsers
from .tokens import account_activation_token
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
import threading


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent(request):
    """Get user agent from request"""
    return request.META.get('HTTP_USER_AGENT', '')


def send_email_async(subject, message, from_email, recipient_list):
    """
    Send email in a background thread to avoid blocking the request.
    Includes timeout to prevent hanging on slow SMTP connections.
    """
    def _send_with_timeout():
        import socket
        import traceback
        
        try:
            # Set a socket timeout for SMTP connections (30 seconds)
            default_timeout = socket.getdefaulttimeout()
            socket.setdefaulttimeout(30)
            
            # CRITICAL FIX: Set fail_silently=False to catch SMTP errors
            result = send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=recipient_list,
                fail_silently=False,  # Changed from True to False
            )
            
            if result == 1:
                print(f"✅ Email sent successfully to {recipient_list}")
            else:
                print(f"⚠️ Email send returned unexpected result: {result} for {recipient_list}")
            
            # Restore default timeout
            socket.setdefaulttimeout(default_timeout)
            
        except Exception as e:
            print(f"❌ CRITICAL: Failed to send email to {recipient_list}")
            print(f"   Error type: {type(e).__name__}")
            print(f"   Error message: {str(e)}")
            print(f"   Full traceback:")
            traceback.print_exc()
            
            # Restore default timeout even on error
            try:
                socket.setdefaulttimeout(default_timeout)
            except:
                pass
    
    # Start email sending in background thread
    email_thread = threading.Thread(target=_send_with_timeout, daemon=True)
    email_thread.start()
    print(f"📧 Email queued for {recipient_list}")


class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration
    POST /api/auth/register/
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        # Debug: Print received data
        print(f"Registration data received: {request.data}")
        print(f"Content-Type: {request.content_type}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Send welcome email asynchronously (non-blocking)
        send_email_async(
            subject='Welcome to ForensicFlow - Registration Successful',
            message=f'''
Hello {user.first_name} {user.last_name},

Welcome to ForensicFlow! Your account has been successfully created.

Your account details:
Username: {user.username}
Email: {user.email}
Employee ID: {user.employee_id}
Department: {user.department}
Role: {user.get_role_display()}

You can now login to the system using your username and password.

If you have any questions, please contact your system administrator.

Best regards,
ForensicFlow Team
            ''',
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@forensicflow.local'),
            recipient_list=[user.email],
        )
        
        return Response({
            'message': 'Registration successful. You can now login with your credentials.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_approved': user.is_approved
            }
        }, status=status.HTTP_201_CREATED)


class UserLoginView(generics.GenericAPIView):
    """
    API endpoint for user login
    POST /api/auth/login/
    """
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        # Debug: Print received data
        print(f"Login data received: {request.data}")
        print(f"Content-Type: {request.content_type}")
        
        serializer = self.get_serializer(data=request.data)
        
        try:
            if not serializer.is_valid():
                print(f"Login validation errors: {serializer.errors}")
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            # Log failed login attempt
            username = request.data.get('username')
            if username:
                try:
                    user = User.objects.get(username=username)
                    LoginHistory.objects.create(
                        user=user,
                        ip_address=get_client_ip(request),
                        user_agent=get_user_agent(request),
                        status='FAILED',
                        failure_reason=str(e)
                    )
                except User.DoesNotExist:
                    pass
            raise
        
        user = serializer.validated_data['user']
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Update last login IP
        user.last_login_ip = get_client_ip(request)
        user.save(update_fields=['last_login_ip'])
        
        # Log successful login
        LoginHistory.objects.create(
            user=user,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
            status='SUCCESS'
        )
        
        return Response({
            'message': 'Login successful',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'role_display': user.get_role_display(),
                'department': user.department,
                'is_approved': user.is_approved,
            }
        })


class UserLogoutView(generics.GenericAPIView):
    """
    API endpoint for user logout
    POST /api/auth/logout/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Update last login history entry with logout time
            last_login = LoginHistory.objects.filter(
                user=request.user,
                logout_time__isnull=True
            ).first()
            
            if last_login:
                last_login.logout_time = timezone.now()
                last_login.save()
            
            # Logout user
            logout(request)
            
            return Response({
                'message': 'Logout successful'
            })
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for user profile
    GET/PUT /api/auth/profile/
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    """
    API endpoint for password change
    POST /api/auth/change-password/
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set new password
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        })


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user management (admin only)
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, CanManageUsers]
    pagination_class = None  # Disable pagination for user management
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        return UserManagementSerializer
    
    def get_queryset(self):
        """Filter users based on query parameters"""
        queryset = User.objects.all()
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by approval status
        is_approved = self.request.query_params.get('is_approved', None)
        if is_approved is not None:
            queryset = queryset.filter(is_approved=is_approved.lower() == 'true')
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve user account"""
        user = self.get_object()
        user.is_approved = True
        user.save()
        
        # Send approval email asynchronously
        send_email_async(
            subject='ForensicFlow - Account Approved',
            message=f'''
Hello {user.first_name},

Great news! Your ForensicFlow account has been approved.

You can now login and access the system:
Login URL: {getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/

Your credentials:
Username: {user.username}
Role: {user.get_role_display()}

Best regards,
ForensicFlow Team
            ''',
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@forensicflow.local'),
            recipient_list=[user.email],
        )
        
        return Response({
            'message': f'User {user.username} approved successfully',
            'user': UserManagementSerializer(user).data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject/deactivate user account"""
        user = self.get_object()
        user.is_approved = False
        user.is_active = False
        user.save()
        
        return Response({
            'message': f'User {user.username} rejected and deactivated',
            'user': UserManagementSerializer(user).data
        })
    
    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Change user role"""
        user = self.get_object()
        new_role = request.data.get('role')
        
        if new_role not in dict(User.ROLE_CHOICES).keys():
            return Response({
                'error': 'Invalid role'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.role = new_role
        user.save()
        
        return Response({
            'message': f'User role changed to {user.get_role_display()}',
            'user': UserManagementSerializer(user).data
        })
    
    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Get list of users pending approval"""
        pending_users = User.objects.filter(is_approved=False, is_active=True)
        serializer = UserListSerializer(pending_users, many=True)
        
        return Response({
            'count': pending_users.count(),
            'users': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get user statistics"""
        stats = {
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'approved_users': User.objects.filter(is_approved=True).count(),
            'pending_approval': User.objects.filter(is_approved=False, is_active=True).count(),
            'by_role': {
                'investigators': User.objects.filter(role=User.INVESTIGATOR).count(),
                'supervisors': User.objects.filter(role=User.SUPERVISOR).count(),
                'administrators': User.objects.filter(role=User.ADMINISTRATOR).count(),
                'guests': User.objects.filter(role=User.GUEST).count(),
            }
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        """Approve multiple users at once"""
        user_ids = request.data.get('user_ids', [])
        if not user_ids:
            return Response(
                {'error': 'No user IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        users = User.objects.filter(id__in=user_ids)
        updated_count = users.update(is_approved=True)
        
        # Send approval emails
        for user in users:
            send_email_async(
                subject='ForensicFlow - Account Approved',
                message=f'''
Hello {user.first_name},

Your ForensicFlow account has been approved! You can now login and access the system.

Username: {user.username}
Role: {user.get_role_display()}

Login at: {getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/

Best regards,
ForensicFlow Team
                ''',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@forensicflow.local'),
                recipient_list=[user.email],
            )
        
        return Response({
            'message': f'Successfully approved {updated_count} users',
            'count': updated_count
        })
    
    @action(detail=False, methods=['post'])
    def bulk_reject(self, request):
        """Reject multiple users at once"""
        user_ids = request.data.get('user_ids', [])
        if not user_ids:
            return Response(
                {'error': 'No user IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        users = User.objects.filter(id__in=user_ids)
        updated_count = users.update(is_approved=False, is_active=False)
        
        return Response({
            'message': f'Successfully rejected {updated_count} users',
            'count': updated_count
        })
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Delete multiple users at once"""
        user_ids = request.data.get('user_ids', [])
        if not user_ids:
            return Response(
                {'error': 'No user IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prevent deleting superusers
        users = User.objects.filter(id__in=user_ids, is_superuser=False)
        deleted_count = users.count()
        users.delete()
        
        return Response({
            'message': f'Successfully deleted {deleted_count} users',
            'count': deleted_count
        })
    
    @action(detail=False, methods=['post'])
    def bulk_change_role(self, request):
        """Change role for multiple users at once"""
        user_ids = request.data.get('user_ids', [])
        new_role = request.data.get('role')
        
        if not user_ids:
            return Response(
                {'error': 'No user IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not new_role or new_role not in dict(User.ROLE_CHOICES):
            return Response(
                {'error': 'Invalid role provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        users = User.objects.filter(id__in=user_ids, is_superuser=False)
        updated_count = users.update(role=new_role)
        
        return Response({
            'message': f'Successfully updated role for {updated_count} users',
            'count': updated_count
        })


class LoginHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for login history
    """
    serializer_class = LoginHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Users can see their own login history
        Administrators can see all login history
        """
        if self.request.user.is_administrator:
            return LoginHistory.objects.all()
        return LoginHistory.objects.filter(user=self.request.user)


class PasswordResetRequestView(generics.GenericAPIView):
    """
    API endpoint for password reset request
    POST /api/auth/password-reset/
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email, is_active=True)
            
            # Generate token
            token = account_activation_token.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Create reset link
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            reset_link = f"{frontend_url}/reset-password?uid={uid}&token={token}"
            
            # Send email asynchronously
            send_email_async(
                subject='ForensicFlow - Password Reset Request',
                message=f'''
Hello {user.first_name},

You requested a password reset for your ForensicFlow account.

Click the link below to reset your password:
{reset_link}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

Best regards,
ForensicFlow Team
                ''',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@forensicflow.local'),
                recipient_list=[email],
            )
            print(f"Password reset email queued for {email}")
            print(f"Reset link: {reset_link}")
            
        except User.DoesNotExist:
            # Don't reveal that the user doesn't exist
            pass
        
        return Response({
            'message': 'If an account with that email exists, a password reset link has been sent.'
        })


class PasswordResetConfirmView(generics.GenericAPIView):
    """
    API endpoint for password reset confirmation
    POST /api/auth/password-reset/confirm/
    """
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uidb64']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                'error': 'Invalid reset link'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not account_activation_token.check_token(user, serializer.validated_data['token']):
            return Response({
                'error': 'Invalid or expired reset link'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Password reset successfully. You can now login with your new password.'
        })

