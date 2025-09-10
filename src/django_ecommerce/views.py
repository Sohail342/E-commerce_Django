from django.shortcuts import render
from shop.models import Product
from shop.models import Category

def home_page(request):
    products = Product.objects.filter(is_draft=False).order_by('-id')[:12]
    trending = Product.objects.filter(is_draft=False, trending=True).order_by('-id')[:16]

    categories = Category.objects.all()
    context = {
        'products': products,
        'categories':categories,
        'trending':trending,
    }
    return render(request, 'base/home.html', context)

# Custom error views
def bad_request(request, exception):
    return render(request, '400.html', status=400)

def permission_denied(request, exception):
    return render(request, '403.html', status=403)

def page_not_found(request, exception):
    return render(request, '404.html', status=404)

def server_error(request):
    return render(request, '500.html', status=500)

