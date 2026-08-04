from django.db import models
from django.conf import settings

CATEGORY_CHOICES = (
    ('mashq', 'Mashq qilish'),
    ('jang', 'Jang'),
    ('musobaqalar', 'Musobaqalar'),
    ('bosh_sahifa', 'Bosh sahifa'),
    ('profil', 'Profil'),
    ('sertifikat', 'Sertifikat'),
    ('tugmalar', 'Tugmalar'),
    ('xabarlar', 'Xabarlar'),
    ('barchasi', 'Barchasi'),
)

LANGUAGE_CHOICES = (
    ('uz', "O'zbekcha"),
    ('en', 'English'),
    ('ru', 'Русский'),
)

TEST_MODE_CHOICES = (
    ('practice', 'Mashq'),
    ('battle', 'Jang'),
    ('competition', 'Musobaqa'),
)

class SystemText(models.Model):
    title = models.CharField(max_length=255, verbose_name="Matn Sarlavhasi")
    content = models.TextField(verbose_name="Matn Mazmuni")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='mashq', verbose_name="Kategoriya")
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='uz', verbose_name="Tili")
    is_active = models.BooleanField(default=True, verbose_name="Faolmi?")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan Vaqti")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Yangilangan Vaqti")

    class Meta:
        verbose_name = "Tizim Matni"
        verbose_name_plural = "Tizim Matnlari"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"


class TestResult(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='test_results', verbose_name="Foydalanuvchi")
    user_name = models.CharField(max_length=200, verbose_name="Foydalanuvchi Ismi")
    wpm = models.IntegerField(default=0, verbose_name="WPM")
    cpm = models.IntegerField(default=0, verbose_name="CPM")
    accuracy = models.FloatField(default=0.0, verbose_name="Aniqlik (%)")
    errors = models.IntegerField(default=0, verbose_name="Xatolar Soni")
    test_type = models.CharField(max_length=30, choices=TEST_MODE_CHOICES, default='practice', verbose_name="Rejim")
    date = models.DateField(auto_now_add=True, verbose_name="Sana")
    text_title = models.CharField(max_length=255, blank=True, null=True, verbose_name="Matn Nomi")

    class Meta:
        verbose_name = "Natija"
        verbose_name_plural = "Natijalar"
        ordering = ['-id']

    def __str__(self):
        return f"{self.user_name} - {self.wpm} WPM ({self.get_test_type_display()})"


class Certificate(models.Model):
    id = models.CharField(max_length=100, primary_key=True, verbose_name="Sertifikat ID")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='certificates', verbose_name="Foydalanuvchi")
    user_name = models.CharField(max_length=200, verbose_name="Ism Familiya")
    login = models.CharField(max_length=100, verbose_name="Login")
    user_avatar = models.CharField(max_length=500, blank=True, null=True, verbose_name="Avatar")
    wpm = models.IntegerField(default=0, verbose_name="WPM")
    net_wpm = models.IntegerField(default=0, verbose_name="Sof WPM")
    accuracy = models.FloatField(default=0.0, verbose_name="Aniqlik (%)")
    test_type = models.CharField(max_length=100, default="Rasmiy Sertifikat Imtihoni", verbose_name="Test Turi")
    date = models.DateField(auto_now_add=True, verbose_name="Berilgan Sana")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan Vaqt")

    class Meta:
        verbose_name = "Sertifikat"
        verbose_name_plural = "Sertifikatlar"
        ordering = ['-created_at']

    def __str__(self):
        return f"Sertifikat: {self.id} - {self.user_name}"
