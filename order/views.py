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
    # Initialize values as Decimal for both authenticated and guest users
    subtotal = Decimal('0')
    total_savings = Decimal('0')
    
    if is_authenticated:
        # For authenticated users
        for item in items:
            price = item.product.sale_price if item.product.on_sale else item.product.price
            subtotal += price * item.quantity
            
            # Calculate savings if product is on sale
            if item.product.on_sale:
                total_savings += (item.product.price - item.product.sale_price) * item.quantity
    else:
        # For guest users or buy now feature
        for item in items:
            # Convert price to Decimal if it's not already
            price = item['price'] if isinstance(item['price'], Decimal) else Decimal(str(item['price']))
            # Ensure quantity is properly converted to integer
            quantity = item['quantity'] if isinstance(item['quantity'], int) else int(str(item['quantity']))
            # Calculate subtotal
            subtotal += price * quantity
            
            # Calculate savings if product is on sale
            if item['product'].on_sale:
                original_price = Decimal(str(item['product'].price))
                total_savings += (original_price - price) * quantity
    
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
    
    # Don't delete the buy_now_product from session yet, we'll do it after processing
    # This ensures we can access it throughout the checkout process

    # Handle Buy Now separately from cart checkout
    if buy_now_product:
        product = get_object_or_404(Product, id=buy_now_product['product_id'])
        # Create a separate list for buy now product, completely isolated from cart
        buy_now_items = [{'product': product, 'quantity': buy_now_product['quantity'], 'price': buy_now_product['price']}]
        cart_is_empty = False
        # Set cart_items to buy_now_items to ensure we only process the buy now product
        cart_items = buy_now_items
    else:
        # Only process cart items if not a buy now purchase
        if request.user.is_authenticated:
            cart_items = cart.items.filter(selected=True)
            cart_is_empty = cart_items.count() == 0
        else:
            # For guest users, include all items in the cart without requiring selection
            cart_items = list(cart)
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
            # Ensure price is properly converted to Decimal from the session data
            price = Decimal(str(buy_now_product['price']))
            # Create a separate list for buy now product, completely isolated from cart
            buy_now_items = [{'product': product, 'quantity': int(buy_now_product['quantity']), 'price': price}]
            # Calculate totals ONLY for the buy now product
            subtotal, total_savings, total = calculate_order_totals(buy_now_items, False)
            
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
                create_order_items(order, buy_now_items, False)
                
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

                # Send order confirmation email
                # send_email(
                #     subject='Order Confirmation',
                #     recipient_list=[emailaddress],
                #     template='order/email/order_confirmation.html',
                #     context={
                #         'order': order,
                #         'items': order.items.all(),
                #         'subtotal': subtotal,
                #         'total': total,
                #     }
                # )
        
        messages.success(request, 'Your order has been placed successfully!')
        return redirect('order:order_summary', order_id=order.order_number) 
    else:
        if buy_now_product:
            # Calculate totals for buy now product
            product = get_object_or_404(Product, id=buy_now_product['product_id'])
            # Ensure price is properly converted to Decimal
            price = Decimal(str(buy_now_product['price']))
            # Ensure quantity is properly converted to integer
            quantity = int(buy_now_product['quantity'])
            # Create a separate list for buy now product, completely isolated from cart
            buy_now_items = [{'product': product, 'quantity': quantity, 'price': price}]
            # Use calculate_order_totals with is_authenticated=False for buy now products
            # This ensures we only calculate based on the buy now product, ignoring cart
            subtotal, total_savings, total = calculate_order_totals(buy_now_items, False)
        elif not cart_is_empty:
            subtotal, total_savings, total = calculate_order_totals(cart_items, request.user.is_authenticated)
        else:
            subtotal = Decimal('0')
            total_savings = Decimal('0')
            total = Decimal('250.00')

    # Determine which items to display in the checkout template
    display_items = buy_now_items if buy_now_product else cart_items
    
    return render(request, 'cart/checkout.html', {
        'subtotal': subtotal,
        'total': total,
        'total_savings': total_savings if not cart_is_empty else 0,
        'cart_is_empty': cart_is_empty,
        'cart_items': display_items,
        'is_buy_now': bool(buy_now_product)  # Flag to indicate if this is a buy now purchase
    })



def order_summary(request, order_id):

    
    # Get the order or return 404
    order = get_object_or_404(Order, order_number=order_id)
    
    # Check if the logged-in user is the creator of this order
    if request.user.is_authenticated:    
        if order.user != request.user:
            from django.contrib import messages
            messages.error(request, "You are not authorized to view this order.")
            from django.shortcuts import redirect
            return redirect('shop:shop')  # Redirect to shop page
    
    # Calculate total quantity and subtotal for the order
    total_quantity = sum(item.quantity for item in order.items.all())
    subtotal = sum(item.price * item.quantity for item in order.items.all())
    
    return render(request, 'order/order_summary.html', {
        'order': order,
        'total_quantity': total_quantity,
        'subtotal': subtotal,
    })
