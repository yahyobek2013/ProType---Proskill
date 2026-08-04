from django.db import models
from django.contrib.auth.models import AbstractUser

ROLE_CHOICES = (
    ('user', 'Foydalanuvchi'),
    ('admin', 'Administrator'),
    ('engineer', 'Muhandis'),
    ('customer', 'Mijoz'),
)

class User(AbstractUser):
    login = models.CharField(max_length=100, unique=True, verbose_name="Login / Taxalluz")
    ism = models.CharField(max_length=100, blank=True, verbose_name="Ism")
    familiya = models.CharField(max_length=100, blank=True, verbose_name="Familiya")
    avatar = models.CharField(max_length=500, blank=True, null=True, verbose_name="Avatar URL / Fayl")
    avatar_file = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name="Avatar Fayli")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user', verbose_name="Roli")
    
    wpm_max = models.IntegerField(default=0, verbose_name="Maksimal WPM")
    accuracy_avg = models.FloatField(default=0.0, verbose_name="O'rtacha Aniqlik (%)")
    tests_completed = models.IntegerField(default=0, verbose_name="Tugallangan Testlar")
    total_words_typed = models.IntegerField(default=0, verbose_name="Jami Yozilgan So'zlar")
    rating = models.IntegerField(default=1000, verbose_name="Reyting Balli")
    badges = models.JSONField(default=list, blank=True, verbose_name="Erishilgan Nishonlar")

    def get_avatar_url(self):
        if self.avatar_file:
            return self.avatar_file.url
        if self.avatar:
            return self.avatar
        return f"https://api.dicebear.com/7.x/bottts/svg?seed={self.login or self.username}"

    def full_name(self):
        name = f"{self.ism} {self.familiya}".strip()
        return name if name else self.username

    def __str__(self):
        return f"{self.full_name()} (@{self.login or self.username})"
