from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('', views.dashboard, name='index'),
    path('analytics/', views.analytics_dashboard, name='analytics'),
]