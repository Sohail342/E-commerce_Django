from django.urls import path
from . import views
from . import ajax_views

app_name = 'cart'

urlpatterns = [
    path('', views.cart_page, name='cart'),
    path('add-to-cart/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('clear_cart/<int:product_id>/', views.clear_cart, name='clear_cart'),
    path('validate_quantity/<int:product_id>/', views.validate_quantity, name='validate_quantity'),
    path('update_selection/<int:product_id>/', views.update_selection, name='update_selection'),
    path('buy-now/product/<int:product_id>/quantity/<int:quantity>/', views.buy_now, name='buy_now'),
    
    # AJAX endpoints
    path('ajax_add_to_cart/<int:product_id>/', ajax_views.ajax_add_to_cart, name='ajax_add_to_cart'),
    path('ajax_get_cart/', ajax_views.ajax_get_cart, name='ajax_get_cart'),
    path('ajax_cart_count/', ajax_views.ajax_cart_count, name='ajax_cart_count'),
    path('ajax_remove_from_cart/<int:product_id>/', ajax_views.ajax_remove_from_cart, name='ajax_remove_from_cart'),
]

from django.contrib import messages
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from .models import Product, Cart, CartItem
from .cart_session import SessionCart
from shop.models import Product
import json
from django.urls import reverse
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import csrf_exempt
