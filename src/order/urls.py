from django.urls import path
from . import views

app_name = 'order'

urlpatterns = [
    path('checkout/', views.checkout, name='checkout'),
    path('order-summary/<str:order_id>/', views.order_summary, name='order_summary'),
    
]
