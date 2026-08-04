from django.urls import path
from . import views

app_name = 'ai_engine'

urlpatterns = [
    path('generate/', views.generate_text_view, name='generate'),
]
