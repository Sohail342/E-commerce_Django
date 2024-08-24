from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.urls import reverse
from SendEmail.views import send_email

def signup(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        form = UserCreationForm(request.POST)
        if form.is_valid():   
            user = form.save()
            login(request, user)
            send_email(email, 'send_emails/welcome.html')
            return redirect(reverse("home"))
    else:
        form =  UserCreationForm()
    return render(request, 'account/signup.html', {'form': form})


def signin(request):
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


def signout(request):
    logout(request)
    return redirect('home')

