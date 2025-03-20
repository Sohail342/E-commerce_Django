from django.urls import path
from . import views

app_name = 'account'

urlpatterns = [
    path('signin', views.signin, name='signin'),
    path('signup/', views.signup, name='signup'),
    path('logout/', views.signout, name="signout"),
    path('profile/', views.profile, name='profile'),
    path('change-password/', views.change_password, name='change_password'),
]