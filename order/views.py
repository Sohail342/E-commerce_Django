from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from cart.models import Cart
from django.shortcuts import get_object_or_404
from order.models import Order, OrderItem
from shop.models import Product
from django.contrib.auth.models import User

@login_required(login_url='account:signin')
def checkout(request, user_id):
    user = get_object_or_404(User, id=user_id)
    cart, created = Cart.objects.get_or_create(user=user)

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

        if cart:
            cart_items = cart.items.all()
            subtotal = sum(item.total_price() for item in cart_items)
            total = 250 + subtotal  # Add delivery charges
            
            # Create a new order
            order = Order(
                user=user,
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
            
            # Clear the cart
            cart.items.all().delete()
            
            messages.success(request, 'Order placed successfully!')
            return redirect('order:order_summary', order_id=order.id)  
    else:
        if cart:
            cart_items = cart.items.all()
            subtotal = sum(item.total_price() for item in cart_items)
            total = 250 + subtotal
        else:
            cart_items = []
            subtotal = 0
            total = 250

    return render(request, 'cart/checkout.html', {
        'subtotal': subtotal,
        'total': total,
    })


def order_summary(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    
    # Calculate total quantity and subtotal for the order
    total_quantity = sum(item.quantity for item in order.items.all())
    subtotal = sum(item.total_price for item in order.items.all())  # Directly access field
    
    return render(request, 'order/order_summary.html', {
        'order': order,
        'total_quantity': total_quantity,
        'subtotal': subtotal
    })
