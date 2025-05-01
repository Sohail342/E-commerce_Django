from django.urls import path
from . import views
from . import search_api

app_name = 'shop'

urlpatterns = [
    path('', views.shop_page, name='shop'),
    path('product/<int:product_id>', views.product_detail, name='product_detail'),
    path('category/<str:category_name>', views.category, name='category'),
    path('sale/products', views.sale_products, name='sale_products'),
    path('api/search/', search_api.search_products, name='search_products'),
]
