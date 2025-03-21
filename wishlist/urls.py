from django.urls import path
from . import views

app_name = 'wishlist'

urlpatterns = [
    path('', views.wishlist, name='wishlist'),
    path('toggle/<int:product_id>/', views.toggle_wishlist, name='toggle_wishlist'),
    path('sync/', views.sync_wishlist, name='sync_wishlist'),
]