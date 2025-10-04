#!/usr/bin/env python
"""
Test email configuration - sends a test email
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'forensicflow_backend.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email():
    print("=" * 60)
    print("ForensicFlow - Email Configuration Test")
    print("=" * 60)
    
    print("\n📧 Email Settings:")
    print(f"   Backend: {settings.EMAIL_BACKEND}")
    print(f"   Host: {settings.EMAIL_HOST}")
    print(f"   Port: {settings.EMAIL_PORT}")
    print(f"   TLS: {settings.EMAIL_USE_TLS}")
    print(f"   User: {settings.EMAIL_HOST_USER}")
    print(f"   From: {settings.DEFAULT_FROM_EMAIL}")
    
    print("\n" + "=" * 60)
    print("Sending test email...")
    print("=" * 60)
    
    try:
        # Send test email
        result = send_mail(
            subject='ForensicFlow - Email Test',
            message='''
Hello!

This is a test email from ForensicFlow.

If you're reading this, your email configuration is working correctly! ✅

Email Features Enabled:
- User Registration Confirmation
- Account Approval Notifications
- Password Reset Links
- Bulk User Action Notifications

Best regards,
ForensicFlow Team
            ''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],  # Send to self
            fail_silently=False,
        )
        
        if result == 1:
            print("\n✅ SUCCESS! Test email sent successfully!")
            print(f"\n📬 Check your inbox: {settings.EMAIL_HOST_USER}")
            print("\nNote: It may take a few moments to arrive.")
            print("Check your spam folder if you don't see it.")
        else:
            print("\n⚠️ Email may not have been sent (result: {})".format(result))
    
    except Exception as e:
        print(f"\n❌ ERROR: Failed to send email")
        print(f"\nError details: {e}")
        
        # Common error suggestions
        print("\n💡 Common issues:")
        print("   1. Check if 2-Step Verification is enabled on Gmail")
        print("   2. Make sure you're using an App Password (not your Gmail password)")
        print("   3. Check if 'Less secure app access' is needed (usually not for App Passwords)")
        print("   4. Verify the App Password is correct: xzbl qted ctas jxuj")
        print("   5. Ensure port 587 is not blocked by firewall")
        
        import traceback
        print("\nFull error trace:")
        traceback.print_exc()

if __name__ == '__main__':
    test_email()
    print("\n" + "=" * 60)
    input("Press Enter to exit...")

