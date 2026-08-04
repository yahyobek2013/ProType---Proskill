from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'texts', views.SystemTextViewSet)
router.register(r'tests', views.TestResultViewSet)
router.register(r'certificates', views.CertificateViewSet)
router.register(r'competitions', views.CompetitionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/me', views.get_current_user_api, name='api_me'),
    path('stats', views.get_system_stats_api, name='api_stats'),
]
