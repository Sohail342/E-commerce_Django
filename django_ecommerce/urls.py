
from django.contrib import admin
from django.urls import path, include
from . import views
from . import settings
from django.contrib.staticfiles.urls import static, staticfiles_urlpatterns
from django.conf.urls import handler400, handler403, handler404, handler500

# Define custom error handlers
handler400 = 'django_ecommerce.views.bad_request'
handler403 = 'django_ecommerce.views.permission_denied'
handler404 = 'django_ecommerce.views.page_not_found'
handler500 = 'django_ecommerce.views.server_error'

urlpatterns = [
    path('zevaristan/admin/', admin.site.urls),
    path('', views.home_page, name='home'),
    path('base/', include('base.urls')),
    path('contact/', include('contact.urls')),
    path('about/', include('about.urls')),
    path('shop/', include('shop.urls')),
    path('cart/', include('cart.urls')),
    path('accounts/', include('account.urls')),
    path('order/', include('order.urls')),
    path('dashboard/', include('dashboard.urls', namespace='dashboard')),
]+static(settings.base.MEDIA_URL, document_root=settings.base.MEDIA_ROOT)
