"""
URL configuration for forensicflow_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root(request):
    """API Root - Lists all available endpoints"""
    return JsonResponse({
        'message': 'ForensicFlow API',
        'version': '1.0',
        'endpoints': {
            'authentication': '/api/auth/',
            'cases': '/api/cases/',
            'evidence': '/api/evidence/',
            'ai_analysis': '/api/ai/',
            'reports': '/api/reports/',
            'audit_logs': '/api/audit/',
            'admin': '/admin/',
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('api/', api_root, name='api-root-alt'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/cases/', include('cases.urls')),
    path('api/evidence/', include('evidence.urls')),
    path('api/ai/', include('ai_analysis.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/audit/', include('audit.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

