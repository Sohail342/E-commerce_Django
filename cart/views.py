from django.contrib import messages
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from .models import Product, Cart, CartItem
from .cart_session import SessionCart
from shop.models import Product
import json
from django.urls import reverse


def get_cart(request):
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
        return cart
    else:
        return SessionCart(request)

def add_to_cart(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    quantity = int(request.GET.get('quantity', 1))
    
    # Get cart_url inside the function instead of at module level
    cart_url = reverse('cart:cart')
    
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
        message = f"""
        <div class="flex flex-col sm:flex-row items-start gap-3">
            <div class="flex-shrink-0 bg-white rounded-lg p-2 shadow-sm">
                <svg class="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            </div>
            <div class="flex-1">
                <p class="font-medium">{product.name} has been added to your cart</p>
                <div class="mt-3 flex flex-col sm:flex-row gap-2">
                    <a href='{cart_url}' class="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300">
                        View Cart
                    </a>
                    <a href="#" onclick="window.history.back(); return false;" class="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300">
                        Continue Shopping
                    </a>
                </div>
            </div>
        </div>
        """
        messages.success(request, message)
    else:
        cart = SessionCart(request)
        
        # For guest users: directly add the product to cart
        # The SessionCart.add method will handle clearing the cart if needed
        cart.add(product, quantity)
        
        message = f"""
        <div class="flex flex-col sm:flex-row items-start gap-3">
            <div class="flex-shrink-0 bg-white rounded-lg p-2 shadow-sm">
                <svg class="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            </div>
            <div class="flex-1">
                <p class="font-medium">{product.name} has been added to your cart</p>
                <div class="mt-3 flex flex-col sm:flex-row gap-2">
                    <a href='{cart_url}' class="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300">
                        View Cart
                    </a>
                    <a href="#" onclick="window.history.back(); return false;" class="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300">
                        Continue Shopping
                    </a>
                </div>
            </div>
        </div>
        """
        messages.success(request, message)
        
        # Add a notification message to session to display on cart page
        if 'pending_cart_item' in request.session:
            del request.session['pending_cart_item']
    
    return redirect(request.META.get('HTTP_REFERER', '/'))

def cart_page(request):
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
        cart_items = cart.items.all()
        total = cart.total_price()
        cart_is_empty = cart_items.count() == 0
    else:
        cart = SessionCart(request)
        cart_items = cart
        total = cart.get_total_price()
        cart_is_empty = len(cart) == 0
        
    
    return render(request, 'cart/cart.html', {
        'cart_items': cart_items,
        'total': total,
        'cart_is_empty': cart_is_empty
    })

def clear_cart(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    
    if request.user.is_authenticated:
        cart = get_object_or_404(Cart, user=request.user)
        cart_item = get_object_or_404(CartItem, product=product_id, cart=cart)
        cart_item.delete()
    else:
        cart = SessionCart(request)
        cart.remove(product)
    
    return redirect('cart:cart')

def total_cart_items(request):
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
        cart_item_count = cart.items.count()
    else:
        cart = SessionCart(request)
        cart_item_count = len(cart)

    return render(request, 'base/navbar.html', {'cart_item_count': cart_item_count})

def validate_quantity(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    requested_quantity = int(request.GET.get('quantity'))
    
    if requested_quantity <= product.inventory:
        if request.user.is_authenticated:
            cart = get_object_or_404(Cart, user=request.user)
            cart_item = get_object_or_404(CartItem, cart=cart, product=product)
            cart_item.quantity = requested_quantity
            cart_item.save()
        else:
            cart = SessionCart(request)
            cart.update(product, requested_quantity)
        
        return JsonResponse({
            'valid': True,
            'quantity': requested_quantity
        })
    else:
        return JsonResponse({
            'valid': False,
            'max_quantity': product.inventory
        })

def update_selection(request, product_id):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Invalid request method'})
    
    try:
        data = json.loads(request.body)
        selected = data.get('selected', False)
        quantity = data.get('quantity', 1)
        
        product = get_object_or_404(Product, id=product_id)
        
        if request.user.is_authenticated:
            cart = get_object_or_404(Cart, user=request.user)
            cart_item = get_object_or_404(CartItem, cart=cart, product=product)
            cart_item.selected = selected
            cart_item.quantity = quantity
            cart_item.save()
        else:
            cart = SessionCart(request)
            cart.update_selection(product_id, selected)
            cart.update(product, quantity)
        
        return JsonResponse({'success': True})
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON data'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


def buy_now(request, product_id, quantity=1):
    # Clear any existing buy now session
    if 'buy_now_product' in request.session:
        del request.session['buy_now_product']
    
    product = get_object_or_404(Product, id=product_id)
    
    # Calculate the correct price based on sale status
    price = product.sale_price if product.on_sale else product.price
    
    # Store buy now product in session
    buy_now_data = {
        'product_id': product.id,
        'quantity': quantity,
        'price': str(price)
    }
    request.session['buy_now_product'] = buy_now_data
    # Directly redirect to checkout without showing cart message
    return redirect('order:checkout')
    
    