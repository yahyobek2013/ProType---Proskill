from django.db import models
from django.conf import settings

STATUS_CHOICES = (
    ('active', 'Aktiv'),
    ('upcoming', 'Kutilayotgan'),
    ('finished', 'Tugallangan'),
)

CERTIFICATE_POLICY_CHOICES = (
    ('none', 'Berilmaydi'),
    ('winner_only', 'Faqat g\'olibga'),
    ('top_3', 'Top-3 ishtirokchiga'),
    ('all_participants', 'Barcha ishtirokchilarga'),
)

class Competition(models.Model):
    title = models.CharField(max_length=255, verbose_name="Musobaqa Nomi")
    description = models.TextField(blank=True, verbose_name="Tavsif")
    start_time = models.DateTimeField(verbose_name="Boshlanish Vaqti")
    end_time = models.DateTimeField(verbose_name="Tugash Vaqti")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming', verbose_name="Holati")
    text = models.TextField(verbose_name="Musobaqa Matni")
    duration = models.IntegerField(default=60, verbose_name="Davomiyligi (soniya)")
    reward_points = models.IntegerField(default=100, verbose_name="Mukofot Ballari")
    certificate_policy = models.CharField(max_length=30, choices=CERTIFICATE_POLICY_CHOICES, default='top_3', verbose_name="Sertifikat Siyosati")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Yaratuvchi")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan Vaqt")

    class Meta:
        verbose_name = "Musobaqa"
        verbose_name_plural = "Musobaqalar"
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class CompetitionParticipant(models.Model):
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name='participants', verbose_name="Musobaqa")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='competition_entries', verbose_name="Foydalanuvchi")
    user_name = models.CharField(max_length=200, verbose_name="Ismi")
    avatar = models.CharField(max_length=500, blank=True, null=True, verbose_name="Avatar URL")
    wpm = models.IntegerField(default=0, verbose_name="WPM")
    net_wpm = models.IntegerField(default=0, verbose_name="Net WPM")
    accuracy = models.FloatField(default=0.0, verbose_name="Aniqlik (%)")
    cpm = models.IntegerField(default=0, verbose_name="CPM")
    errors = models.IntegerField(default=0, verbose_name="Xatolar")
    correct_chars = models.IntegerField(default=0, verbose_name="To'g'ri belgilar")
    incorrect_chars = models.IntegerField(default=0, verbose_name="Noto'g'ri belgilar")
    total_chars_typed = models.IntegerField(default=0, verbose_name="Jami belgilar")
    total_words_typed = models.IntegerField(default=0, verbose_name="Jami so'zlar")
    score = models.IntegerField(default=0, verbose_name="Ochko")
    rank = models.IntegerField(null=True, blank=True, verbose_name="O'rni")
    speed_history = models.JSONField(default=list, blank=True, verbose_name="Tezlik Dinamikasi")
    mistake_details = models.JSONField(default=list, blank=True, verbose_name="Xatolar Tahlili")
    joined_at = models.DateTimeField(auto_now_add=True, verbose_name="Qatnashgan Vaqti")

    class Meta:
        verbose_name = "Musobaqa Ishtirokchisi"
        verbose_name_plural = "Musobaqa Ishtirokchilari"
        unique_together = ('competition', 'user')
        ordering = ['-score', '-wpm']

    def __str__(self):
        return f"{self.user_name} - {self.competition.title} ({self.wpm} WPM)"
