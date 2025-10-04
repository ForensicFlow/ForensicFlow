"""
URL configuration for AI analysis app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QueryViewSet, AIInsightViewSet, ReportItemViewSet, ChatSessionViewSet

router = DefaultRouter()
router.register(r'queries', QueryViewSet, basename='query')
router.register(r'insights', AIInsightViewSet, basename='insight')
router.register(r'report-items', ReportItemViewSet, basename='report-item')
router.register(r'chat-sessions', ChatSessionViewSet, basename='chat-session')

urlpatterns = [
    path('', include(router.urls)),
]

