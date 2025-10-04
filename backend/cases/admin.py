"""
Admin configuration for cases
"""
from django.contrib import admin
from .models import Case, CaseFile


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ['case_number', 'name', 'status', 'created_at', 'updated_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'case_number', 'description']
    filter_horizontal = ['investigators']


@admin.register(CaseFile)
class CaseFileAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'case', 'file_type', 'uploaded_at', 'processed']
    list_filter = ['file_type', 'processed', 'uploaded_at']
    search_fields = ['original_filename', 'case__name']

