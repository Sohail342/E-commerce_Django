from django.urls import path
from . import views, api

app_name = 'shop'

urlpatterns = [
    path('', views.shop_page, name='shop'),
    path('product/<int:product_id>', views.product_detail, name='product_detail'),
    path('category/<str:category_name>', views.category, name='category'),
    path('api/search', api.search_products, name='search_products'),
]
