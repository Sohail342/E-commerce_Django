from django.http import JsonResponse
from django.views.decorators.http import require_GET
from .models import Product

@require_GET
def search_products(request):
    """API endpoint for live product search"""
    query = request.GET.get('q', '').strip()
    limit = int(request.GET.get('limit', 5))
    
    if not query:
        return JsonResponse({'products': []})
    
    # Search for products that match the query
    products = Product.objects.filter(
        is_draft=False,
        name__icontains=query
    ).order_by('-created_at')[:limit]
    print(products, "Products")
    # Format the results
    results = [{
        'id': product.id,
        'name': product.name,
        'price': float(product.sale_price if product.on_sale else product.price),
        'image': request.build_absolute_uri(product.photo.url) if product.photo else None,
        'url': f'/shop/product/{product.id}/',
        'on_sale': product.on_sale,
        'sale_percentage': product.sale_percentage if product.on_sale else 0
    } for product in products]
    
    return JsonResponse({'products': results})