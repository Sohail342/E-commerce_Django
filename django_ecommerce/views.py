from django.shortcuts import render
from shop.models import Product
from contact.forms import SubscriberForm
from shop.models import Category

def home_page(request):
    products = Product.objects.all()[:8]
    forms = SubscriberForm()
    
    categories = Category.objects.all()
    if request.method == 'POST':
        forms = SubscriberForm(request.POST)
        if forms.is_valid():
            forms.save()
    context = {
        'products': products,
        'categories':categories,
    }
    return render(request, 'home.html', context)

