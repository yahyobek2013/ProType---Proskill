from rest_framework import serializers
from apps.accounts.models import User
from apps.dashboard.models import SystemText, TestResult, Certificate
from apps.projects.models import Competition, CompetitionParticipant

class UserSerializer(serializers.ModelResourceSerializer if hasattr(serializers, 'ModelResourceSerializer') else serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'login', 'ism', 'familiya', 'avatar', 'role', 'wpm_max', 'accuracy_avg', 'tests_completed', 'total_words_typed', 'rating', 'badges']

class SystemTextSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemText
        fields = '__all__'

class TestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestResult
        fields = '__all__'

class CertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = '__all__'

class CompetitionParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompetitionParticipant
        fields = '__all__'

class CompetitionSerializer(serializers.ModelSerializer):
    participants = CompetitionParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = Competition
        fields = '__all__'
