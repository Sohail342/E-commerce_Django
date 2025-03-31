from decimal import Decimal
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from django.db import transaction
from cart.models import Cart, CartItem
from order.models import Order, OrderItem
from django.contrib.auth.models import User
from SendEmail.views import send_email
from cart.views import get_cart
from shop.models import Product
from cart.cart_session import SessionCart
from typing import Union, List, Dict, Any

def calculate_order_totals(items: List[Union[CartItem, Dict[str, Any]]], is_authenticated: bool) -> tuple:
    """Calculate subtotal, total savings and total for order items."""
    if is_authenticated:
        subtotal = sum((item.product.sale_price if item.product.on_sale else item.product.price) * item.quantity for item in items)
        total_savings = sum((item.product.price - item.product.sale_price) * item.quantity for item in items if item.product.on_sale)
    else:
        subtotal = sum((item['price'] if isinstance(item['price'], Decimal) else Decimal(str(item['price']))) * Decimal(str(item['quantity'])) for item in items)
        total_savings = sum(((Decimal(str(item['product'].price)) - (item['price'] if isinstance(item['price'], Decimal) else Decimal(str(item['price'])))) * Decimal(str(item['quantity']))) for item in items if item['product'].on_sale)
    
    total = Decimal('250.00') + subtotal  # Add delivery charges
    return subtotal, total_savings, total

@transaction.atomic
def create_order_items(order: Order, items: List[Union[CartItem, Dict[str, Any]]], is_authenticated: bool) -> None:
    """Create order items and update product inventory."""
    for item in items:
        if is_authenticated:
            product = item.product
            quantity = item.quantity
            price = product.sale_price if product.on_sale else product.price
        else:
            product = item['product']
            quantity = item['quantity']
            price = item['price']
            
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=quantity,
            price=price
        )
        
        # Update inventory
        product.inventory -= quantity
        if product.inventory <= 0:
            product.delete()
        else:
            product.save()

def checkout(request):
    cart = get_cart(request)
    total_savings = 0
    buy_now_product = request.session.get('buy_now_product')
    
    if 'buy_now_product' in request.session:
        del request.session['buy_now_product']

    if buy_now_product:
        product = get_object_or_404(Product, id=buy_now_product['product_id'])
        cart_items = [{'product': product, 'quantity': buy_now_product['quantity'], 'price': buy_now_product['price']}]
        cart_is_empty = False
    else:
        if request.user.is_authenticated:
            cart_items = cart.items.filter(selected=True)
            cart_is_empty = cart_items.count() == 0
        else:
            # For guest users, get only selected items from session cart
            # Filter items based on their selection status
            # Ensure we're only including items that are explicitly marked as selected
            # Convert string 'true'/'false' to boolean if needed
            cart_items = []
            for item in cart:
                selected = item.get('selected', False)
                # Handle case where selected might be stored as a string
                if isinstance(selected, str):
                    selected = selected.lower() == 'true'
                if selected:
                    cart_items.append(item)
            cart_is_empty = len(cart_items) == 0

    if request.method == 'POST':
        # Collect data from form
        firstname = request.POST.get('firstname')
        lastname = request.POST.get('lastname')
        streetaddress = request.POST.get('streetaddress')
        apartment = request.POST.get('apartment', '')  
        towncity = request.POST.get('towncity')
        postcodezip = request.POST.get('postcodezip')
        phone = request.POST.get('phone')
        emailaddress = request.POST.get('emailaddress')
        shipping_address = f"{streetaddress} {apartment}, {towncity}, {postcodezip}"
        payment_method = request.POST.get('payment_method')  

        if buy_now_product:
            # Handle buy now product checkout
            cart_items = [{'product': product, 'quantity': buy_now_product['quantity'], 'price': product.sale_price if product.on_sale else product.price}]
            subtotal, total_savings, total = calculate_order_totals(cart_items, False)
            
            with transaction.atomic():
                # Create order for buy now product
                order = Order.objects.create(
                    user=request.user if request.user.is_authenticated else None,
                    total_price=total,
                    shipping_address=shipping_address,
                    payment_method=payment_method,
                    created_at=timezone.now(),
                    updated_at=timezone.now(),
                    is_paid=False
                )
                
                # Create order items and update inventory
                create_order_items(order, cart_items, False)
                
                # Clear buy now session
                del request.session['buy_now_product']

        elif request.user.is_authenticated:
            # Calculate totals for selected items only
            subtotal = sum(item.total_price() for item in cart_items)
            total_savings = sum((item.product.price - item.product.sale_price) * item.quantity for item in cart_items if item.product.on_sale)
            total = 250 + subtotal  # Add delivery charges to subtotal
            
            with transaction.atomic():
                # Create a new order for authenticated user
                order = Order.objects.create(
                    user=request.user,
                    cart=cart,
                    total_price=total,
                    shipping_address=shipping_address,
                    payment_method=payment_method,
                    created_at=timezone.now(),
                    updated_at=timezone.now(),
                    is_paid=False 
                )
                
                # Create order items and update inventory
                create_order_items(order, cart_items, True)
                
                # Clear the cart
                cart.items.all().delete()
        else:
            # Handle guest user order
            subtotal, total_savings, total = calculate_order_totals(cart_items, False)
            
            with transaction.atomic():
                # Create a new order for guest user
                order = Order.objects.create(
                    user=None,  # Guest user
                    total_price=total,
                    shipping_address=shipping_address,
                    payment_method=payment_method,
                    created_at=timezone.now(),
                    updated_at=timezone.now(),
                    is_paid=False 
                )
                
                # Create order items and update inventory
                create_order_items(order, cart_items, False)
                
                # Clear the session cart
                cart.clear()
                if 'buy_now_product' in request.session:
                    del request.session['buy_now_product']
        
        messages.success(request, 'Order placed successfully!')
        send_email(emailaddress, 'SendEmail/succefully_order.html') 
        return redirect('order:order_summary', order_id=order.id) 
    else:
        if buy_now_product:
            # Calculate totals for buy now product
            product = get_object_or_404(Product, id=buy_now_product['product_id'])
            cart_items = [{'product': product, 'quantity': buy_now_product['quantity'], 'price': product.sale_price if product.on_sale else product.price}]
            subtotal, total_savings, total = calculate_order_totals(cart_items, False)
        elif not cart_is_empty:
            subtotal, total_savings, total = calculate_order_totals(cart_items, request.user.is_authenticated)
        else:
            subtotal = Decimal('0')
            total_savings = Decimal('0')
            total = Decimal('250.00')

    return render(request, 'cart/checkout.html', {
        'subtotal': subtotal,
        'total': total,
        'total_savings': total_savings if not cart_is_empty else 0,
        'cart_is_empty': cart_is_empty,
        'cart_items': cart_items
    })


def order_summary(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    
    # Calculate total quantity and subtotal for the order
    total_quantity = sum(item.quantity for item in order.items.all())
    subtotal = sum(item.price * item.quantity for item in order.items.all())
    
    
    return render(request, 'order/order_summary.html', {
        'order': order,
        'total_quantity': total_quantity,
        'subtotal': subtotal,
    })
