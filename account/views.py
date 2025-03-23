from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, update_session_auth_hash
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.contrib import messages
from SendEmail.views import send_email
from .forms import UserRegForm
from order.models import Order

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

