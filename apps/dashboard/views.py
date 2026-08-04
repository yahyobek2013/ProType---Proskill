from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Max, Count, Sum
from apps.accounts.models import User
from .models import SystemText, TestResult, Certificate

def home_view(request):
    top_typists = User.objects.order_by('-wpm_max')[:5]
    total_users = User.objects.count()
    total_tests = TestResult.objects.count()
    avg_wpm = TestResult.objects.aggregate(Avg('wpm'))['wpm__avg'] or 0

    context = {
        'active_tab': 'home',
        'top_typists': top_typists,
        'stats': {
            'total_users': total_users,
            'total_tests': total_tests,
            'avg_wpm': round(avg_wpm, 1),
        }
    }
    return render(request, 'dashboard/home.html', context)

def practice_view(request):
    texts = SystemText.objects.filter(is_active=True, category='mashq')
    if not texts.exists():
        texts = SystemText.objects.filter(is_active=True)
    
    selected_text = texts.first()
    context = {
        'active_tab': 'mashq',
        'texts': texts,
        'selected_text': selected_text,
    }
    return render(request, 'dashboard/practice.html', context)

def battle_view(request):
    texts = SystemText.objects.filter(is_active=True, category='jang')
    if not texts.exists():
        texts = SystemText.objects.filter(is_active=True)
        
    context = {
        'active_tab': 'jang',
        'texts': texts,
    }
    return render(request, 'dashboard/battle.html', context)

def leaderboard_view(request):
    users = User.objects.order_by('-rating', '-wpm_max')[:100]
    context = {
        'active_tab': 'reyting',
        'users': users,
        'top_three': users[:3],
    }
    return render(request, 'dashboard/leaderboard.html', context)

@login_required
def statistics_view(request):
    user = request.user
    user_tests = TestResult.objects.filter(user=user).order_by('-id')
    
    avg_wpm = user_tests.aggregate(Avg('wpm'))['wpm__avg'] or 0
    avg_accuracy = user_tests.aggregate(Avg('accuracy'))['accuracy__avg'] or 0
    max_wpm = user_tests.aggregate(Max('wpm'))['wpm__max'] or 0
    
    context = {
        'active_tab': 'statistika',
        'user_tests': user_tests[:50],
        'avg_wpm': round(avg_wpm, 1),
        'avg_accuracy': round(avg_accuracy, 1),
        'max_wpm': max_wpm,
        'total_tests': user_tests.count(),
    }
    return render(request, 'dashboard/statistics.html', context)

@login_required
def admin_panel_view(request):
    if request.user.role != 'admin' and not request.user.is_superuser:
        return redirect('dashboard:home')
        
    users = User.objects.all().order_by('-id')
    texts = SystemText.objects.all().order_by('-id')
    certificates = Certificate.objects.all().order_by('-created_at')
    
    context = {
        'active_tab': 'admin',
        'users': users,
        'texts': texts,
        'certificates': certificates,
    }
    return render(request, 'dashboard/admin_panel.html', context)
