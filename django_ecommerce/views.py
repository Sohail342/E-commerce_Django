from django.shortcuts import render
from shop.models import Product
from shop.models import Category

def home_page(request):
    products = Product.objects.all()[:8]
    categories = Category.objects.all()
    
    context = {
        'products': products,
        'categories':categories,
    }
    return render(request, 'home.html', context)

