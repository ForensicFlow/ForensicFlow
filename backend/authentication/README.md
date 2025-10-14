# Authentication System - ForensicFlow

## Overview

ForensicFlow implements a comprehensive role-based authentication system with JWT tokens. This document describes the authentication flow, user roles, and API endpoints.

---

## User Roles

### 1. **Investigator Officer (IO)** (`INVESTIGATOR`)
- **Role**: Main user of the system
- **Permissions**:
  - Upload UFDR case files
  - Query AI chatbot (FlowBot)
  - View/search evidence for assigned cases
  - Generate reports for assigned cases
  - Share findings with supervisor
- **Restrictions**: Can only access assigned cases

### 2. **Supervisor / Senior Investigator** (`SUPERVISOR`)
- **Role**: Oversees multiple investigators' cases
- **Permissions**:
  - All Investigator permissions
  - Access all cases in the system
  - Assign or reassign cases to investigators
  - Review AI-generated reports
  - Approve final reports before submission
- **Restrictions**: None (full case access)

### 3. **Administrator** (`ADMINISTRATOR`)
- **Role**: System Admin / Agency IT Staff
- **Permissions**:
  - All system permissions
  - Manage users (add/remove/edit)
  - Assign roles to users
  - Approve/reject user registrations
  - View login history and audit logs
  - Manage system security settings
- **Restrictions**: None (full system access)

### 4. **Guest / Training User** (`GUEST`)
- **Role**: Restricted account for demo or training
- **Permissions**:
  - Explore sample/demo cases
  - Read-only access to allowed resources
- **Restrictions**:
  - Cannot upload real UFDR files
  - No access to sensitive investigation data
  - Read-only access

---

## Authentication Flow

### 1. Registration
```
POST /api/auth/register/
```

**Request Body**:
```json
{
  "username": "officer123",
  "email": "officer@agency.gov",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "employee_id": "EMP001",
  "department": "Cybercrime Division",
  "phone_number": "+1234567890"
}
```

**Response** (201 Created):
```json
{
  "message": "Registration successful. You can now login with your credentials.",
  "user": {
    "id": 1,
    "username": "officer123",
    "email": "officer@agency.gov",
    "first_name": "John",
    "last_name": "Doe",
    "role": "INVESTIGATOR",
    "is_approved": true
  }
}
```

**Notes**:
- New users are created with `INVESTIGATOR` role by default
- Users can login immediately after registration
- Password must meet Django's validation requirements
- Administrators can still manually approve/reject users if needed

---

### 2. Login
```
POST /api/auth/login/
```

**Request Body**:
```json
{
  "username": "officer123",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "tokens": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  },
  "user": {
    "id": 1,
    "username": "officer123",
    "email": "officer@agency.gov",
    "first_name": "John",
    "last_name": "Doe",
    "role": "INVESTIGATOR",
    "role_display": "Investigator Officer (IO)",
    "department": "Cybercrime Division",
    "is_approved": true
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account disabled

**Notes**:
- Returns JWT access token (1 hour validity) and refresh token (7 days validity)
- Login attempt is logged in LoginHistory
- User's last login IP is updated

---

### 3. Token Refresh
```
POST /api/auth/token/refresh/
```

**Request Body**:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Notes**:
- Use this endpoint to get a new access token when it expires
- Refresh token is rotated for security

---

### 4. Logout
```
POST /api/auth/logout/
```

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "message": "Logout successful"
}
```

**Notes**:
- Updates logout time in LoginHistory
- Client should discard tokens after logout

---

## User Management

### Get User Profile
```
GET /api/auth/profile/
```

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "username": "officer123",
  "email": "officer@agency.gov",
  "first_name": "John",
  "last_name": "Doe",
  "employee_id": "EMP001",
  "department": "Cybercrime Division",
  "phone_number": "+1234567890",
  "role": "INVESTIGATOR",
  "role_display": "Investigator Officer (IO)",
  "is_approved": true,
  "two_factor_enabled": false,
  "date_joined": "2025-10-01T10:30:00Z",
  "last_login": "2025-10-02T08:15:00Z",
  "last_login_ip": "192.168.1.100"
}
```

---

### Update User Profile
```
PUT /api/auth/profile/
PATCH /api/auth/profile/
```

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "email": "newemail@agency.gov",
  "phone_number": "+1234567891",
  "two_factor_enabled": true
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "username": "officer123",
  "email": "newemail@agency.gov",
  ...
}
```

**Notes**:
- Users cannot change their own role or approval status
- Username cannot be changed

---

### Change Password
```
POST /api/auth/change-password/
```

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "old_password": "SecurePass123!",
  "new_password": "NewSecurePass456!",
  "new_password_confirm": "NewSecurePass456!"
}
```

**Response** (200 OK):
```json
{
  "message": "Password changed successfully"
}
```

---

## Admin-Only Endpoints

### List All Users
```
GET /api/auth/users/
```

**Permission**: Administrator only

**Query Parameters**:
- `role`: Filter by role (INVESTIGATOR, SUPERVISOR, ADMINISTRATOR, GUEST)
- `is_approved`: Filter by approval status (true/false)
- `is_active`: Filter by active status (true/false)

**Response** (200 OK):
```json
{
  "count": 50,
  "next": "http://localhost:8000/api/auth/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "username": "officer123",
      "email": "officer@agency.gov",
      "first_name": "John",
      "last_name": "Doe",
      "employee_id": "EMP001",
      "department": "Cybercrime Division",
      "role": "INVESTIGATOR",
      "role_display": "Investigator Officer (IO)",
      "is_active": true,
      "is_approved": true,
      "date_joined": "2025-10-01T10:30:00Z",
      "last_login": "2025-10-02T08:15:00Z"
    }
  ]
}
```

---

### Get Pending Approvals
```
GET /api/auth/users/pending_approvals/
```

**Permission**: Administrator only

**Response** (200 OK):
```json
{
  "count": 3,
  "users": [
    {
      "id": 5,
      "username": "newofficer",
      "email": "new@agency.gov",
      "first_name": "Jane",
      "last_name": "Smith",
      "employee_id": "EMP005",
      "department": "Forensics",
      "role": "INVESTIGATOR",
      "role_display": "Investigator Officer (IO)",
      "is_active": true,
      "is_approved": false,
      "date_joined": "2025-10-02T09:00:00Z"
    }
  ]
}
```

---

### Approve User
```
POST /api/auth/users/{user_id}/approve/
```

**Permission**: Administrator only

**Response** (200 OK):
```json
{
  "message": "User newofficer approved successfully",
  "user": {
    "id": 5,
    "username": "newofficer",
    "is_approved": true,
    ...
  }
}
```

---

### Reject/Deactivate User
```
POST /api/auth/users/{user_id}/reject/
```

**Permission**: Administrator only

**Response** (200 OK):
```json
{
  "message": "User newofficer rejected and deactivated",
  "user": {
    "id": 5,
    "username": "newofficer",
    "is_approved": false,
    "is_active": false,
    ...
  }
}
```

---

### Change User Role
```
POST /api/auth/users/{user_id}/change_role/
```

**Permission**: Administrator only

**Request Body**:
```json
{
  "role": "SUPERVISOR"
}
```

**Response** (200 OK):
```json
{
  "message": "User role changed to Supervisor / Senior Investigator",
  "user": {
    "id": 1,
    "username": "officer123",
    "role": "SUPERVISOR",
    "role_display": "Supervisor / Senior Investigator",
    ...
  }
}
```

---

### User Statistics
```
GET /api/auth/users/statistics/
```

**Permission**: Administrator only

**Response** (200 OK):
```json
{
  "total_users": 50,
  "active_users": 48,
  "approved_users": 45,
  "pending_approval": 3,
  "by_role": {
    "investigators": 35,
    "supervisors": 10,
    "administrators": 3,
    "guests": 2
  }
}
```

---

## Login History

### Get Login History
```
GET /api/auth/login-history/
```

**Permission**: 
- Users can view their own login history
- Administrators can view all login history

**Response** (200 OK):
```json
{
  "count": 25,
  "results": [
    {
      "id": 1,
      "user": 1,
      "user_info": {
        "id": 1,
        "username": "officer123",
        "email": "officer@agency.gov",
        ...
      },
      "login_time": "2025-10-02T08:15:00Z",
      "logout_time": "2025-10-02T17:30:00Z",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "status": "SUCCESS",
      "failure_reason": ""
    }
  ]
}
```

---

## Permission Classes

The authentication system provides the following permission classes:

### `IsAdministrator`
Allows access only to administrators.

### `IsSupervisor`
Allows access to supervisors and administrators.

### `IsInvestigator`
Allows access to investigators, supervisors, and administrators (excludes guests).

### `IsNotGuest`
Denies access to guest users.

### `CanUploadUFDR`
Allows UFDR file uploads (investigators, supervisors, administrators).

### `CanManageUsers`
Allows user management (administrators only).

### `CanApproveReports`
Allows report approval (supervisors and administrators).

### `CanAssignCases`
Allows case assignment (supervisors and administrators).

### `IsAccountApproved`
Requires user account to be approved by an administrator.

### `HasCaseAccess`
Object-level permission to check case access:
- Administrators: Access to all cases
- Supervisors: Access to all cases
- Investigators: Access to assigned cases only
- Guests: No access

### `ReadOnlyForGuest`
Allows read-only access for guests, full access for others.

---

## Usage Examples

### Using Permissions in Views

```python
from rest_framework import viewsets
from authentication.permissions import IsInvestigator, HasCaseAccess

class EvidenceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsInvestigator, HasCaseAccess]
    
    def get_queryset(self):
        user = self.request.user
        
        # Administrators and supervisors see all evidence
        if user.is_administrator or user.is_supervisor:
            return Evidence.objects.all()
        
        # Investigators see only evidence from their cases
        return Evidence.objects.filter(
            case__investigators=user
        )
```

### Checking Permissions Programmatically

```python
from authentication.models import User

user = request.user

# Check role
if user.is_administrator:
    # Admin-specific logic
    pass

# Check specific permissions
if user.can_upload_ufdr():
    # Allow UFDR upload
    pass

# Check case access
if user.has_case_access(case):
    # Grant access to case
    pass
```

---

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Password Validation**: Django's built-in password validators
3. **Account Approval**: New accounts require admin approval
4. **Login History**: Track all login attempts with IP and user agent
5. **Role-Based Access Control**: Fine-grained permissions based on user role
6. **Token Rotation**: Refresh tokens are rotated on use
7. **Token Blacklisting**: Old tokens are blacklisted after rotation
8. **IP Tracking**: Last login IP is tracked for security

---

## Database Migrations

After creating the authentication system, run migrations:

```bash
# Create migrations
python manage.py makemigrations authentication

# Apply migrations
python manage.py migrate authentication
```

**Note**: This will create a custom User table. Make sure to run this BEFORE creating any other migrations that reference the User model.

---

## Creating Superuser

```bash
python manage.py createsuperuser
```

The superuser will have:
- `is_superuser=True`
- `is_staff=True`
- `is_approved=True`
- `role=ADMINISTRATOR` (set manually via admin)

---

## Environment Variables

No additional environment variables are required. JWT uses the existing `SECRET_KEY` from Django settings.

---

## Testing Authentication

### Using cURL

**Register**:
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "password_confirm": "TestPass123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123!"
  }'
```

**Access Protected Endpoint**:
```bash
curl -X GET http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer <access_token>"
```

---

## Frontend Integration

### Store Tokens
```javascript
// After successful login
localStorage.setItem('access_token', response.data.tokens.access);
localStorage.setItem('refresh_token', response.data.tokens.refresh);
localStorage.setItem('user', JSON.stringify(response.data.user));
```

### Add to Request Headers
```javascript
const config = {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
};

axios.get('/api/cases/', config);
```

### Handle Token Refresh
```javascript
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response.status === 401) {
      const refresh = localStorage.getItem('refresh_token');
      
      try {
        const response = await axios.post('/api/auth/token/refresh/', {
          refresh: refresh
        });
        
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        
        // Retry original request
        error.config.headers['Authorization'] = `Bearer ${response.data.access}`;
        return axios.request(error.config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## Troubleshooting

### "Your account is pending approval"
- Contact an administrator to approve your account
- Administrators can approve via `/api/auth/users/{id}/approve/`

### "Invalid credentials"
- Check username and password
- Ensure account is active and approved

### "Token expired"
- Use refresh token to get new access token
- If refresh token is expired, login again

---

## Support

For issues or questions, contact the ForensicFlow development team.


