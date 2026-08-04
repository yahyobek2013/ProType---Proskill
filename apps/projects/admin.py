from django.contrib import admin
from .models import Competition, CompetitionParticipant

@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'start_time', 'end_time', 'reward_points', 'certificate_policy')
    list_filter = ('status', 'certificate_policy')
    search_fields = ('title', 'description')

@admin.register(CompetitionParticipant)
class CompetitionParticipantAdmin(admin.ModelAdmin):
    list_display = ('user_name', 'competition', 'wpm', 'net_wpm', 'accuracy', 'score', 'rank')
    list_filter = ('competition', 'joined_at')
    search_fields = ('user_name', 'competition__title')
