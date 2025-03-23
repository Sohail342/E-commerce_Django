
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
    path('accounts/', include('account.urls')),
    path('order/', include('order.urls')),
    path('wishlist/', include('wishlist.urls', namespace='wishlist')),
]+static(settings.base.MEDIA_URL, document_root=settings.base.MEDIA_ROOT)
