from django.urls import path
from . import views

app_name = 'shop'

urlpatterns = [
    path('', views.shop_page, name='shop'),
    path('product/<int:product_id>', views.product_detail, name='product_detail'),
    path('category/<str:category_name>', views.category, name='category'),
    path('sale/products', views.sale_products, name='sale_products'),
]
