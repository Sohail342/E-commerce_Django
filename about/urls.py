from django.urls import path
from .views import reviews_view, Shipping_information, Other_details

app_name = 'about'
urlpatterns = [
    path('', reviews_view, name='about'),
    path('shipping-information/', Shipping_information, name="shipping-information"),
    path('other-details/', Other_details, name="other-details"),
]
