"""
Serializers for authentication
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from .models import User, LoginHistory


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'employee_id', 
            'department', 'phone_number'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs
    
    def validate_email(self, value):
        """Validate unique email"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value
    
    def validate_employee_id(self, value):
        """Validate unique employee ID if provided"""
        if value and User.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError("Employee ID already registered.")
        return value
    
    def create(self, validated_data):
        """Create new user"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Create user with INVESTIGATOR role by default
        # Administrator will approve and can change role
        user = User.objects.create_user(
            password=password,
            role=User.INVESTIGATOR,
            is_approved=False,  # Requires admin approval
            **validated_data
        )
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate credentials"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(
                request=self.context.get('request'),
                username=username,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError(
                    "Unable to log in with provided credentials.",
                    code='authentication'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    "User account is disabled.",
                    code='authentication'
                )
            
            if not user.is_approved and not user.is_superuser:
                raise serializers.ValidationError(
                    "Your account is pending approval by an administrator.",
                    code='not_approved'
                )
            
        else:
            raise serializers.ValidationError(
                "Must include 'username' and 'password'.",
                code='authentication'
            )
        
        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'employee_id', 'department', 'phone_number',
            'role', 'role_display', 'is_approved', 'two_factor_enabled',
            'date_joined', 'last_login', 'last_login_ip'
        ]
        read_only_fields = [
            'id', 'username', 'role', 'is_approved', 
            'date_joined', 'last_login', 'last_login_ip'
        ]


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for user list (admin view)
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'employee_id', 'department', 'role', 'role_display',
            'is_active', 'is_approved', 'date_joined', 'last_login'
        ]


class UserManagementSerializer(serializers.ModelSerializer):
    """
    Serializer for user management (admin only)
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'employee_id', 'department', 'phone_number',
            'role', 'role_display', 'is_active', 'is_approved',
            'two_factor_enabled', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'last_login']
    
    def update(self, instance, validated_data):
        """Update user (admin can modify role and approval status)"""
        # Admin can change role and approval status
        instance.role = validated_data.get('role', instance.role)
        instance.is_approved = validated_data.get('is_approved', instance.is_approved)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        
        # Update other fields
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.department = validated_data.get('department', instance.department)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.two_factor_enabled = validated_data.get('two_factor_enabled', instance.two_factor_enabled)
        
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change
    """
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate passwords"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password": "Password fields didn't match."
            })
        return attrs
    
    def validate_old_password(self, value):
        """Validate old password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class LoginHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for login history
    """
    user_info = UserListSerializer(source='user', read_only=True)
    
    class Meta:
        model = LoginHistory
        fields = [
            'id', 'user', 'user_info', 'login_time', 'logout_time',
            'ip_address', 'user_agent', 'status', 'failure_reason'
        ]
        read_only_fields = fields


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for password reset request
    """
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation
    """
    token = serializers.CharField(required=True)
    uidb64 = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate passwords match"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password": "Password fields didn't match."
            })
        return attrs


