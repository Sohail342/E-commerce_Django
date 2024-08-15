
from django.contrib import admin
from django.urls import path, include
from . import views
from . import settings
from django.contrib.staticfiles.urls import static, staticfiles_urlpatterns


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home_page, name='home'),
    path('contact/', include('contact.urls')),
    path('about/', include('about.urls')),
    path('shop/', include('shop.urls')),
    path('cart/', include('cart.urls')),
    path('ckeditor/', include('ckeditor_uploader.urls')),
    path('account/', include('account.urls')),
]+static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
