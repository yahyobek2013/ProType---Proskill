from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Avg, Max
from apps.accounts.models import User
from apps.dashboard.models import SystemText, TestResult, Certificate
from apps.projects.models import Competition, CompetitionParticipant
from .serializers import (
    UserSerializer,
    SystemTextSerializer,
    TestResultSerializer,
    CertificateSerializer,
    CompetitionSerializer,
    CompetitionParticipantSerializer
)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-rating')
    serializer_class = UserSerializer

class SystemTextViewSet(viewsets.ModelViewSet):
    queryset = SystemText.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = SystemTextSerializer

class TestResultViewSet(viewsets.ModelViewSet):
    queryset = TestResult.objects.all().order_by('-id')
    serializer_class = TestResultSerializer

class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all().order_by('-created_at')
    serializer_class = CertificateSerializer

class CompetitionViewSet(viewsets.ModelViewSet):
    queryset = Competition.objects.all().order_by('-start_time')
    serializer_class = CompetitionSerializer

@api_view(['GET'])
def get_current_user_api(request):
    if request.user.is_authenticated:
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    # Default admin or anonymous fallback
    admin_user = User.objects.filter(role='admin').first() or User.objects.first()
    if admin_user:
        return Response(UserSerializer(admin_user).data)
    return Response({'error': 'Akkount topilmadi'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def get_system_stats_api(request):
    total_users = User.objects.count()
    total_tests = TestResult.objects.count()
    avg_wpm = TestResult.objects.aggregate(Avg('wpm'))['wpm__avg'] or 0
    active_competitions = Competition.objects.filter(status='active').count()
    top_user = User.objects.order_by('-wpm_max').first()

    return Response({
        'total_users': total_users,
        'total_tests': total_tests,
        'avg_wpm': round(avg_wpm, 1),
        'active_competitions': active_competitions,
        'top_typist': {
            'name': top_user.full_name() if top_user else 'ProTypist',
            'wpm': top_user.wpm_max if top_user else 0
        }
    })
