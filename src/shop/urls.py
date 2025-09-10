from django.urls import path
from . import views
from . import search_api
from . import image_upload_views

app_name = 'shop'

urlpatterns = [
    path('', views.shop_page, name='shop'),
    path('product/<int:product_id>/', views.product_detail, name='product_detail'),
    path('category/<str:category_name>', views.category, name='category'),
    path('sale/products', views.sale_products, name='sale_products'),
    path('api/search/', search_api.search_products, name='search_products'),
    # Image upload URLs
    path('product/<int:product_id>/manage-images/', image_upload_views.manage_product_images, name='manage_product_images'),
    path('product/<int:product_id>/upload-images/', image_upload_views.upload_multiple_images, name='upload_multiple_images'),
    path('product/<int:product_id>/ajax-upload-image/', image_upload_views.ajax_upload_image, name='ajax_upload_image'),
]
