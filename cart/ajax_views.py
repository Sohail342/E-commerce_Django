from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.shortcuts import get_object_or_404
import json
from shop.models import Product
from .models import Cart, CartItem
from .cart_session import SessionCart
from decimal import Decimal

@require_POST
def ajax_add_to_cart(request, product_id):
    """Add a product to the cart via AJAX"""
    product = get_object_or_404(Product, id=product_id)
    
    try:
        data = json.loads(request.body)
        quantity = int(data.get('quantity', 1))
    except (ValueError, json.JSONDecodeError):
        quantity = 1
    
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
        cart_item, item_created = CartItem.objects.get_or_create(cart=cart, product=product)
        
        # Calculate total quantity (existing + new)
        total_quantity = quantity
        if not item_created:
            total_quantity = cart_item.quantity + quantity
        
        # Check if total quantity exceeds inventory
        if total_quantity > product.inventory:
            total_quantity = product.inventory  # Limit total quantity to available inventory
            
        # Set the new quantity
        cart_item.quantity = total_quantity
        cart_item.save()
        
        return JsonResponse({
            'success': True,
            'product_name': product.name,
            'quantity': total_quantity,
            'cart_count': cart.items.count()
        })
    else:
        cart = SessionCart(request)
        cart.add(product, quantity)
        
        return JsonResponse({
            'success': True,
            'product_name': product.name,
            'quantity': quantity,
            'cart_count': len(cart)
        })

@require_GET
def ajax_get_cart(request):
    """Get cart contents for the side cart"""
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
        cart_items = cart.items.all()
        
        items = [{
            'id': item.product.id,
            'name': item.product.name,
            'price': float(item.product.sale_price if item.product.on_sale else item.product.price),
            'quantity': item.quantity,
            'image': request.build_absolute_uri(item.product.photo.url),
            'total': float(item.total_price())
        } for item in cart_items]
        
        return JsonResponse({
            'items': items,
            'subtotal': float(cart.total_price()),
            'count': cart.items.count()
        })
    else:
        cart = SessionCart(request)
        
        items = []
        for item in cart:
            product = item['product']
            price = Decimal(item['price'])
            quantity = item['quantity']
            
            items.append({
                'id': product.id,
                'name': product.name,
                'price': float(price),
                'quantity': quantity,
                'image': request.build_absolute_uri(product.photo.url),
                'total': float(price * quantity)
            })
        
        return JsonResponse({
            'items': items,
            'subtotal': float(cart.get_total_price()),
            'count': len(cart)
        })

@require_GET
def ajax_cart_count(request):
    """Get the number of items in the cart"""
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
        count = cart.items.count()
    else:
        cart = SessionCart(request)
        count = len(cart)
    
    return JsonResponse({'count': count})

@require_POST
def ajax_remove_from_cart(request, product_id):
    """Remove an item from the cart"""
    product = get_object_or_404(Product, id=product_id)
    
    if request.user.is_authenticated:
        cart = get_object_or_404(Cart, user=request.user)
        try:
            cart_item = CartItem.objects.get(cart=cart, product=product)
            cart_item.delete()
            success = True
        except CartItem.DoesNotExist:
            success = False
    else:
        cart = SessionCart(request)
        cart.remove(product)
        success = True
    
    return JsonResponse({'success': success})