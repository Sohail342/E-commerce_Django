from django.http import JsonResponse
from .models import Product
from django.db.models import Q

def search_products(request):
    query = request.GET.get('q', '')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    
    products = Product.objects.filter(is_draft=False)
    
    if query:
        products = products.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query)
        )
    
    if min_price:
        products = products.filter(price__gte=float(min_price))
    if max_price:
        products = products.filter(price__lte=float(max_price))
    
    products = products.order_by('-id')
    
    results = [{
        'id': product.id,
        'name': product.name,
        'price': str(product.price),
        'image_url': product.image.url if product.image else None,
        'url': f'/shop/product/{product.id}'
    } for product in products]
    
    return JsonResponse({
        'products': results,
        'count': len(results)
    })