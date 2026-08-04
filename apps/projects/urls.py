from django.urls import path
from . import views

app_name = 'projects'

urlpatterns = [
    path('', views.competition_list_view, name='list'),
    path('<int:comp_id>/', views.competition_detail_view, name='detail'),
]
