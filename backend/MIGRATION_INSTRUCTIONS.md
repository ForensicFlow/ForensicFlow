# Migration Instructions for Security Updates

## Overview
This guide will help you apply the security improvements to your ForensicFlow database.

## Prerequisites
- Backup your database before proceeding
- Ensure no active users are in the system
- Have database admin access

## Step-by-Step Migration

### 1. Backup Database
```bash
# PostgreSQL
pg_dump -U your_user -d forensicflow_db > backup_$(date +%Y%m%d).sql

# Or using Django
python manage.py dumpdata > backup_$(date +%Y%m%d).json
```

### 2. Run Migrations
```bash
cd backend

# Create migration files for the new indexes
python manage.py makemigrations

# Expected output:
# - cases/migrations/000X_auto_YYYYMMDD_HHMM.py
# - ai_analysis/migrations/000X_auto_YYYYMMDD_HHMM.py  
# - reports/migrations/000X_auto_YYYYMMDD_HHMM.py

# Review migrations
python manage.py showmigrations

# Apply migrations
python manage.py migrate
```

### 3. Verify Indexes Created
```bash
# PostgreSQL - Check indexes
python manage.py dbshell

# Then run:
\di

# Look for indexes on:
# - cases (updated_at, status, case_number)
# - ai_analysis_query (created_at, case_id, user_id)
# - ai_analysis_aiinsight (case_id, insight_type)
# - ai_analysis_reportitem (case_id, section, order)
# - ai_analysis_chatsession (case_id, user_id, last_message_at)
# - reports_report (case_id, created_by_id, report_type)
```

### 4. Verify User Assignments
```bash
# Check that all cases have at least one investigator assigned
python manage.py shell

from cases.models import Case
orphaned_cases = Case.objects.filter(investigators__isnull=True)
print(f"Cases without investigators: {orphaned_cases.count()}")

# If there are orphaned cases, assign them:
# for case in orphaned_cases:
#     # Assign to an admin or appropriate user
#     case.investigators.add(admin_user)
```

### 5. Test Authentication
```bash
# Test that endpoints require authentication
curl -X GET http://localhost:8000/api/cases/
# Should return 401 or 403

# Test with authentication
curl -X GET http://localhost:8000/api/cases/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# Should return only accessible cases
```

### 6. Performance Testing
```bash
# Check query performance
python manage.py shell

from django.db import connection
from django.test.utils import CaptureQueriesContext
from cases.models import Case

with CaptureQueriesContext(connection) as queries:
    list(Case.objects.filter(investigators__id=1).prefetch_related('investigators'))
    print(f"Number of queries: {len(queries)}")
    # Should be 2-3 queries (not 10+ without optimization)
```

## Common Issues & Solutions

### Issue 1: Migration Conflicts
```bash
# If you see migration conflicts:
python manage.py migrate --fake-initial
```

### Issue 2: Existing Users Can't Access Data
**Cause**: Users not assigned to cases

**Solution**:
```python
# In Django shell
from django.contrib.auth import get_user_model
from cases.models import Case

User = get_user_model()

# Assign all cases to admins temporarily
admin = User.objects.filter(is_administrator=True).first()
for case in Case.objects.all():
    if case.investigators.count() == 0:
        case.investigators.add(admin)
```

### Issue 3: Slow Queries After Migration
**Cause**: Indexes not created or statistics not updated

**Solution**:
```sql
-- PostgreSQL
ANALYZE;
VACUUM ANALYZE;

-- This updates query planner statistics
```

### Issue 4: Permission Denied Errors
**Cause**: User account not approved

**Solution**:
```python
# In Django shell
from django.contrib.auth import get_user_model

User = get_user_model()

# Approve all existing users
User.objects.update(is_approved=True)
```

## Rollback Procedure

If you need to rollback:

### 1. Rollback Migrations
```bash
# List migrations
python manage.py showmigrations

# Rollback to previous state
# For cases app:
python manage.py migrate cases 000X  # Replace X with previous migration number

# For ai_analysis app:
python manage.py migrate ai_analysis 000X

# For reports app:
python manage.py migrate reports 000X
```

### 2. Restore Database
```bash
# PostgreSQL
psql -U your_user -d forensicflow_db < backup_YYYYMMDD.sql

# Or using Django
python manage.py loaddata backup_YYYYMMDD.json
```

## Post-Migration Verification

### 1. Check All User Roles
```python
from django.contrib.auth import get_user_model

User = get_user_model()

print("User Role Distribution:")
print(f"Administrators: {User.objects.filter(role='ADMINISTRATOR').count()}")
print(f"Supervisors: {User.objects.filter(role='SUPERVISOR').count()}")
print(f"Investigators: {User.objects.filter(role='INVESTIGATOR').count()}")
print(f"Guests: {User.objects.filter(role='GUEST').count()}")
```

### 2. Test Case Access Control
```python
from django.contrib.auth import get_user_model
from cases.models import Case

User = get_user_model()

# Get a non-admin user
investigator = User.objects.filter(role='INVESTIGATOR').first()

# Check case access
cases = Case.objects.filter(investigators=investigator)
print(f"Investigator can access {cases.count()} cases")

# Test has_case_access method
test_case = Case.objects.first()
print(f"Has access to case: {investigator.has_case_access(test_case)}")
```

### 3. Test Evidence Filtering
```python
from evidence.models import Evidence
from django.contrib.auth import get_user_model

User = get_user_model()
investigator = User.objects.filter(role='INVESTIGATOR').first()

# Check evidence access
evidence = Evidence.objects.filter(case__investigators=investigator)
print(f"Investigator can access {evidence.count()} evidence items")
```

### 4. Monitor Logs
```bash
# Check for permission denied errors
tail -f logs/django.log | grep "403"

# Check for database errors
tail -f logs/django.log | grep "ERROR"
```

## Performance Monitoring

### Before and After Comparison
```python
import time
from django.db import connection
from django.test.utils import CaptureQueriesContext

# Test query performance
def test_query_performance():
    start = time.time()
    with CaptureQueriesContext(connection) as queries:
        # Simulate typical query
        cases = list(Case.objects.all().prefetch_related('investigators')[:100])
    end = time.time()
    
    print(f"Query count: {len(queries)}")
    print(f"Execution time: {end - start:.2f}s")
    
    return len(queries), end - start

# Run test
query_count, exec_time = test_query_performance()
```

## Production Deployment Checklist

- [ ] Database backup completed
- [ ] Migrations applied successfully
- [ ] Indexes verified in database
- [ ] All users have case assignments
- [ ] All users have approved status
- [ ] Authentication tested on all endpoints
- [ ] Performance monitoring in place
- [ ] Rollback plan documented
- [ ] Team notified of changes
- [ ] API documentation updated
- [ ] Frontend updated to handle new permissions

## Maintenance

### Regular Tasks
1. **Weekly**: Review audit logs for unauthorized access attempts
2. **Monthly**: Check for orphaned cases without investigators
3. **Quarterly**: Analyze query performance and optimize as needed

### Index Maintenance
```sql
-- PostgreSQL: Rebuild indexes quarterly
REINDEX DATABASE forensicflow_db;

-- Update statistics
ANALYZE;
```

## Support Contacts

If you encounter issues during migration:

1. Check the error logs
2. Review the rollback procedure
3. Contact the development team
4. Reference: DATA_ISOLATION_SECURITY_IMPROVEMENTS.md

---

**Last Updated**: 2025-10-04
**Version**: 1.0

