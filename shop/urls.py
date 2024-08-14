from django.urls import path
from . import views

app_name = 'shop'

urlpatterns = [
    path('', views.shop_page, name='shop'),
    path('product/<int:product_id>', views.product_details, name='product-details'),
    path('wishlist/', views.wishlist, name='wishlist'),
    path('category/<str:category_name>', views.category, name='category'),
]
