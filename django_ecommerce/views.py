from django.shortcuts import render
from shop.models import Product
from shop.models import Category

def home_page(request):
    products = Product.objects.filter(is_draft=False).order_by('-id')[:8]
    categories = Category.objects.all()
    
    context = {
        'products': products,
        'categories':categories,
    }
    return render(request, 'home.html', context)

