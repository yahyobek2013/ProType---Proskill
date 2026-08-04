import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import AIGenerationLog

@csrf_exempt
def generate_text_view(request):
    if request.method == 'POST':
        import json
        try:
            data = json.loads(request.body)
            prompt = data.get('prompt', "Tez yozish uchun qiziqarli o'zbekcha matn yaratib ber.")
            category = data.get('category', 'mashq')
            language = data.get('language', 'uz')

            generated_text = f"ProType AI Generatsiya: {prompt}. Klaviatura tezligingizni oshirish har kuni muntazam ravishda mashq qilishni va barmoqlaringizni to'g'ri joylashtirishni talab qiladi."

            if request.user.is_authenticated:
                AIGenerationLog.objects.create(
                    user=request.user,
                    prompt=prompt,
                    generated_text=generated_text,
                    category=category,
                    language=language
                )

            return JsonResponse({'text': generated_text, 'success': True})
        except Exception as e:
            return JsonResponse({'error': str(e), 'success': False}, status=400)
    return JsonResponse({'error': 'Faqat POST so\'rovi qabul qilinadi.'}, status=405)
