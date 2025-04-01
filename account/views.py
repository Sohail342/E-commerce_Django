from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, update_session_auth_hash
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.contrib import messages
from SendEmail.views import send_email
from .forms import UserRegForm
from order.models import Order, OrderItem
from decimal import Decimal

def signup(request):
    if not request.user.is_authenticated:
        if request.method == 'POST':
            email = request.POST.get('email')
            form = UserRegForm(request.POST)
            if form.is_valid():   
                user = form.save()
                login(request, user)
                send_email(email, 'SendEmail/welcome.html')
                return redirect(reverse("home"))
        else:
            form =  UserRegForm()
        return render(request, 'account/signup.html', {'form': form})
    else:
        return redirect(reverse('home'))


def signin(request):
    if not request.user.is_authenticated:
        if request.method == "POST":
            form = AuthenticationForm(request, data=request.POST)
            if form.is_valid():
                user = form.get_user()
                login(request, user)
                
                next_url = request.POST.get('next', reverse("home"))
                return redirect(next_url)
        else:
            form = AuthenticationForm()
        return render(request, 'account/signin.html', {'form': form})
    else:
        return redirect(reverse('home'))


def signout(request):
    logout(request)
    return redirect('home')

@login_required
def order_history(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'account/order_history.html', {'orders': orders})

@login_required
def order_detail(request, order_id):
    # Check if user is authenticated
    if not request.user.is_authenticated:
        from django.contrib import messages
        messages.error(request, "You need to login to view order details.")
        from django.shortcuts import redirect
        return redirect('account:signin')

    # Get the order
    order = get_object_or_404(Order, id=order_id, user=request.user)


     # Check if the logged-in user is the creator of this order
    if order.user != request.user:
        from django.contrib import messages
        messages.error(request, "You are not authorized to view this order.")
        from django.shortcuts import redirect
        return redirect('shop:shop')  # Redirect to shop page
    
    # Calculate subtotal (total price - delivery charges)
    subtotal = order.total_price - Decimal('250.00')
    
    context = {
        'order': order,
        'subtotal': subtotal,
    }
    
    return render(request, 'account/order_detail.html', context)

@login_required
def profile(request):
    if request.method == 'POST':
        user = request.user
        email = request.POST.get('email')
        if not email:
            messages.error(request, 'Email is required.')
            return redirect('account:profile')
        user.first_name = request.POST.get('first_name')
        user.last_name = request.POST.get('last_name')
        user.email = email
        try:
            user.save()
            messages.success(request, 'Profile updated successfully!')
        except Exception as e:
            messages.error(request, 'Failed to update profile. Please try again.')
        return redirect('account:profile')
    return render(request, 'account/profile.html')

@login_required
def change_password(request):
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            messages.success(request, 'Your password was successfully updated!')
            return redirect('account:profile')
    else:
        form = PasswordChangeForm(request.user)
    return render(request, 'account/change_password.html', {'form': form})

