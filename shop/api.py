from django.http import JsonResponse
from .models import Product, Category
from django.db.models import Q
from django.urls import reverse
import logging
from django.core.exceptions import ValidationError

# Set up logger
logger = logging.getLogger(__name__)

def search_products(request):
    try:
        query = request.GET.get('q', '')
        min_price = request.GET.get('min_price')
        max_price = request.GET.get('max_price')
        category_id = request.GET.get('category_id')
        category_name = request.GET.get('category_name')
        
        # Log search parameters for debugging
        logger.debug(f"Search request: query={query}, min_price={min_price}, max_price={max_price}, category_id={category_id}, category_name={category_name}")
        
        # Start with a base queryset and use select_related to optimize DB queries
        products = Product.objects.select_related('category').filter(is_draft=False)
        
        # Validate price parameters
        price_error = None
        if min_price and max_price:
            try:
                min_price_float = float(min_price)
                max_price_float = float(max_price)
                if min_price_float > max_price_float:
                    price_error = "Minimum price cannot be greater than maximum price"
            except (ValueError, TypeError):
                price_error = "Invalid price format"
        
        if price_error:
            logger.warning(f"Price validation error: {price_error}")
            return JsonResponse({
                'products': [],
                'count': 0,
                'error': True,
                'error_message': price_error
            }, status=400)
        
        # Optimize search query with more efficient filtering
        if query:
            # Split the query into words for more precise searching
            query_words = query.split()
            if len(query_words) > 1:
                # Multi-word search with Q objects for better performance
                q_objects = Q()
                for word in query_words:
                    if len(word) > 2:  # Only search for words with more than 2 characters
                        q_objects |= Q(name__icontains=word) | Q(details__icontains=word)
                products = products.filter(q_objects)
            else:
                # Single word search
                products = products.filter(
                    Q(name__icontains=query) |
                    Q(details__icontains=query)
                )
        
        # Apply price filters with better error handling
        if min_price:
            try:
                products = products.filter(price__gte=float(min_price))
            except (ValueError, TypeError) as e:
                logger.warning(f"Invalid min_price parameter: {min_price}, Error: {str(e)}")
                return JsonResponse({
                    'products': [],
                    'count': 0,
                    'error': True,
                    'error_message': "Invalid minimum price format"
                }, status=400)
                
        if max_price:
            try:
                products = products.filter(price__lte=float(max_price))
            except (ValueError, TypeError) as e:
                logger.warning(f"Invalid max_price parameter: {max_price}, Error: {str(e)}")
                return JsonResponse({
                    'products': [],
                    'count': 0,
                    'error': True,
                    'error_message': "Invalid maximum price format"
                }, status=400)
                
        # Apply category filter with better error handling
        if category_id:
            try:
                products = products.filter(category_id=int(category_id))
            except (ValueError, TypeError) as e:
                logger.warning(f"Invalid category_id parameter: {category_id}, Error: {str(e)}")
                return JsonResponse({
                    'products': [],
                    'count': 0,
                    'error': True,
                    'error_message': "Invalid category ID format"
                }, status=400)
        
        # Apply category name filter if provided
        if category_name:
            try:
                products = products.filter(category__name__icontains=category_name)
            except Exception as e:
                logger.warning(f"Error filtering by category_name: {category_name}, Error: {str(e)}")
        
        # Limit results for performance
        products = products.order_by('-id')[:50]
        
        # Build response data
        results = [{
            'id': product.id,
            'name': product.name,
            'price': str(product.price),
            'sale_price': str(product.sale_price) if product.on_sale else None,
            'on_sale': product.on_sale,
            'image_url': product.photo.url if product.photo else None,
            'url': reverse('shop:product_detail', args=[product.id]),
            'category': product.category.name,
            'trending': product.trending,
            'rating': float(product.rating)
        } for product in products]
        
        # Log successful search
        logger.info(f"Search completed: query={query}, found {len(results)} results")
        
        return JsonResponse({
            'products': results,
            'count': len(results),
            'success': True
        })
        
    except ValidationError as e:
        logger.error(f"Validation error in search: {str(e)}")
        return JsonResponse({
            'products': [],
            'count': 0,
            'error': True,
            'error_message': str(e)
        }, status=400)
        
    except Exception as e:
        # Log the error for debugging
        logger.error(f"Unexpected error in search_products: {str(e)}", exc_info=True)
        
        # Return a user-friendly error response
        return JsonResponse({
            'products': [],
            'count': 0,
            'error': True,
            'error_message': "An unexpected error occurred while searching. Please try again later."
        }, status=500)