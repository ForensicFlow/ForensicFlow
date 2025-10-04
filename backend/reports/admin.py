"""
Admin configuration for reports
"""
from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'case', 'report_type', 'format', 'created_by', 'created_at', 'version']
    list_filter = ['report_type', 'format', 'created_at']
    search_fields = ['title', 'case__name', 'content']

