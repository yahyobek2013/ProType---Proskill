from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'login', 'ism', 'familiya', 'role', 'rating', 'wpm_max', 'accuracy_avg', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'login', 'ism', 'familiya', 'email')
    ordering = ('-rating',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('ProType Profil Ma\'lumotlari', {
            'fields': ('login', 'ism', 'familiya', 'avatar', 'avatar_file', 'role', 'wpm_max', 'accuracy_avg', 'tests_completed', 'total_words_typed', 'rating', 'badges')
        }),
    )
