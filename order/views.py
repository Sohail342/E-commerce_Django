from django.shortcuts import render, redirect
from django.contrib import messages
from django.utils import timezone
from cart.models import Cart, CartItem
from django.shortcuts import get_object_or_404
from order.models import Order, OrderItem
from django.contrib.auth.models import User
from SendEmail.views import send_email
from cart.views import get_cart
from shop.models import Product
from cart.cart_session import SessionCart

def checkout(request):
    cart = get_cart(request)
    total_savings = 0  # Initialize total_savings at the start
    
    # Check if this is a buy now checkout
    buy_now_product = request.session.get('buy_now_product')
    if buy_now_product:
        product = get_object_or_404(Product, id=buy_now_product['product_id'])
        cart_items = [{'product': product, 'quantity': buy_now_product['quantity'], 'price': buy_now_product['price']}]
        cart_is_empty = False
    else:
        if request.user.is_authenticated:
            cart_items = cart.items.all()
            cart_is_empty = cart_items.count() == 0
        else:
            cart_items = cart
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
            # Calculate total for buy now product
            product = get_object_or_404(Product, id=buy_now_product['product_id'])
            quantity = buy_now_product['quantity']
            price = product.sale_price if product.on_sale else product.price
            subtotal = price * quantity
            total_savings = (product.price - product.sale_price) * quantity if product.on_sale else 0
            total = 250 + subtotal  # Add delivery charges

            # Create order for buy now product
            order = Order(
                user=request.user if request.user.is_authenticated else None,
                total_price=total,
                shipping_address=shipping_address,
                payment_method=payment_method,
                created_at=timezone.now(),
                updated_at=timezone.now(),
                is_paid=False
            )
            order.save()

            # Create order item
            OrderItem(
                order=order,
                product=product,
                quantity=quantity,
                price=price
            ).save()

            # Update inventory
            product.inventory -= quantity
            if product.inventory <= 0:
                product.delete()
            else:
                product.save()

            # Clear buy now session
            del request.session['buy_now_product']

        elif request.user.is_authenticated:
            subtotal = sum(item.total_price() for item in cart_items)
            total_savings = sum((item.product.price - item.product.sale_price) * item.quantity for item in cart_items if item.product.on_sale)
            total = 250 + subtotal  # Add delivery charges to subtotal
            
            # Create a new order for authenticated user
            order = Order(
                user=request.user,
                cart=cart,
                total_price=total,
                shipping_address=shipping_address,
                payment_method=payment_method,
                created_at=timezone.now(),
                updated_at=timezone.now(),
                is_paid=False 
            )
            order.save()
            
            # Create order items
            for item in cart_items:
                OrderItem(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price=item.product.price,
                ).save()
                
                # Decrease the product inventory
                product = item.product
                product.inventory -= item.quantity
                if product.inventory <= 0:
                    product.delete()
                else:
                    product.save()
            
            # Clear the cart
            cart.items.all().delete()
        else:
            # Handle guest user order
            subtotal = sum((item['product'].sale_price if item['product'].on_sale else item['product'].price) * item['quantity'] for item in cart)
            total_savings = sum((item['product'].price - item['product'].sale_price) * item['quantity'] for item in cart if item['product'].on_sale)
            total = 250 + subtotal  # Add delivery charges to subtotal
            
            # Create a new order for guest user
            order = Order(
                user=None,  # Guest user
                total_price=total,
                shipping_address=shipping_address,
                payment_method=payment_method,
                created_at=timezone.now(),
                updated_at=timezone.now(),
                is_paid=False 
            )
            order.save()
            
            # Create order items from session cart
            for item in cart:
                product = item['product']
                quantity = item['quantity']
                OrderItem(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price=item['price'],
                ).save()
                
                # Decrease the product inventory
                product.inventory -= quantity
                if product.inventory <= 0:
                    product.delete()
                else:
                    product.save()
            
            # Clear the session cart and buy now product
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
            quantity = buy_now_product['quantity']
            price = product.sale_price if product.on_sale else product.price
            subtotal = price * quantity
            total_savings = (product.price - product.sale_price) * quantity if product.on_sale else 0
            total = 250 + subtotal  # Add delivery charges
        elif not cart_is_empty:
            if request.user.is_authenticated:
                subtotal = sum((item.product.sale_price if item.product.on_sale else item.product.price) * item.quantity for item in cart_items)
                total_savings = sum((item.product.price - item.product.sale_price) * item.quantity for item in cart_items if item.product.on_sale)
            else:
                subtotal = sum((item['product'].sale_price if item['product'].on_sale else item['product'].price) * item['quantity'] for item in cart)
                total_savings = sum((item['product'].price - item['product'].sale_price) * item['quantity'] for item in cart if item['product'].on_sale)
            total = 250 + subtotal  # Add delivery charges
        else:
            subtotal = 0
            total = 250

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
    
    return render(request, 'order/order_summary.html', {
        'order': order,
        'total_quantity': total_quantity,
    })
