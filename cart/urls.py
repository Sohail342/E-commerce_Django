from django.urls import path
from . import views

app_name = 'cart'

urlpatterns = [
    path('', views.cart_page, name='cart'),
    path('add-to-cart/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('clear_cart/<int:product_id>/', views.clear_cart, name='clear_cart'),
    path('validate_quantity/<int:product_id>/', views.validate_quantity, name='validate_quantity'),
    path('update_selection/<int:product_id>/', views.update_selection, name='update_selection'),
    path('buy-now/product/<int:product_id>/quantity/<int:quantity>/', views.buy_now, name='buy_now'),
]
