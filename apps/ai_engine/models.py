from django.db import models
from django.conf import settings

class AIGenerationLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Foydalanuvchi")
    prompt = models.TextField(verbose_name="Prompt")
    generated_text = models.TextField(verbose_name="Yaratilgan Matn")
    category = models.CharField(max_length=50, default='mashq', verbose_name="Kategoriya")
    language = models.CharField(max_length=10, default='uz', verbose_name="Tili")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Vaqti")

    class Meta:
        verbose_name = "AI Generatsiya Jurnali"
        verbose_name_plural = "AI Generatsiya Jurnallari"
        ordering = ['-created_at']

    def __str__(self):
        return f"AI Prompt: {self.prompt[:30]}..."
