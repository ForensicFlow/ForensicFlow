#!/usr/bin/env python
"""
Script to fix admin account - reactivate and reset password
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'forensicflow_backend.settings')
django.setup()

from authentication.models import User

def fix_admin():
    print("=" * 60)
    print("ForensicFlow - Fix Admin Account")
    print("=" * 60)
    
    # Try to find admin user
    try:
        # Try common admin usernames
        admin_user = None
        for username in ['admin', 'Admin', 'administrator']:
            try:
                admin_user = User.objects.get(username=username)
                print(f"\n✓ Found user: {username}")
                break
            except User.DoesNotExist:
                continue
        
        if not admin_user:
            # Show all users
            print("\n❌ No admin user found. Here are all existing users:")
            users = User.objects.all()
            if users.exists():
                for user in users:
                    print(f"  - {user.username} (Email: {user.email}, Staff: {user.is_staff}, Active: {user.is_active})")
                
                print("\nEnter the username you want to fix (or press Enter to create new admin):")
                username = input("> ").strip()
                
                if username:
                    try:
                        admin_user = User.objects.get(username=username)
                    except User.DoesNotExist:
                        print(f"❌ User '{username}' not found!")
                        return
            else:
                print("  No users found in database.")
        
        if admin_user:
            print(f"\n📝 Current status:")
            print(f"   Username: {admin_user.username}")
            print(f"   Email: {admin_user.email}")
            print(f"   Active: {admin_user.is_active}")
            print(f"   Approved: {admin_user.is_approved}")
            print(f"   Staff: {admin_user.is_staff}")
            print(f"   Superuser: {admin_user.is_superuser}")
            print(f"   Role: {admin_user.role}")
            
            # Fix the account
            print("\n🔧 Fixing account...")
            admin_user.is_active = True
            admin_user.is_approved = True
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.role = 'ADMINISTRATOR'
            admin_user.set_password('admin123')
            admin_user.save()
            
            print("\n✅ Account fixed successfully!")
            print(f"\n🔑 Login credentials:")
            print(f"   Username: {admin_user.username}")
            print(f"   Password: admin123")
            print(f"\n   Django Admin: http://localhost:8000/admin")
            print(f"   ForensicFlow: http://localhost:5173")
        else:
            # Create new admin
            print("\n📝 Creating new admin user...")
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@forensicflow.local',
                password='admin123',
                first_name='Admin',
                last_name='User',
                employee_id='ADMIN001',
                department='Administration',
                role='ADMINISTRATOR'
            )
            admin_user.is_approved = True
            admin_user.save()
            
            print("\n✅ New admin account created!")
            print(f"\n🔑 Login credentials:")
            print(f"   Username: admin")
            print(f"   Password: admin123")
            print(f"\n   Django Admin: http://localhost:8000/admin")
            print(f"   ForensicFlow: http://localhost:5173")
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    fix_admin()
    print("\n" + "=" * 60)
    input("Press Enter to exit...")

