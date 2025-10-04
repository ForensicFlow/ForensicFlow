"""
URL configuration for evidence app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvidenceViewSet, EntityViewSet, ConnectionViewSet

router = DefaultRouter()
router.register(r'items', EvidenceViewSet, basename='evidence')
router.register(r'entities', EntityViewSet, basename='entity')
router.register(r'connections', ConnectionViewSet, basename='connection')

urlpatterns = [
    path('', include(router.urls)),
]

