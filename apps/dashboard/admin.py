from django.contrib import admin
from .models import SystemText, TestResult, Certificate

@admin.register(SystemText)
class SystemTextAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'language', 'is_active', 'created_at')
    list_filter = ('category', 'language', 'is_active')
    search_fields = ('title', 'content')

@admin.register(TestResult)
class TestResultAdmin(admin.ModelAdmin):
    list_display = ('user_name', 'wpm', 'cpm', 'accuracy', 'errors', 'test_type', 'date')
    list_filter = ('test_type', 'date')
    search_fields = ('user_name', 'text_title')

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_name', 'login', 'wpm', 'accuracy', 'test_type', 'date')
    search_fields = ('id', 'user_name', 'login')
    list_filter = ('date', 'test_type')
