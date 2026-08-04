from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('', views.home_view, name='home'),
    path('mashq/', views.practice_view, name='practice'),
    path('jang/', views.battle_view, name='battle'),
    path('reyting/', views.leaderboard_view, name='leaderboard'),
    path('statistika/', views.statistics_view, name='statistics'),
    path('admin-panel/', views.admin_panel_view, name='admin_panel'),
]
