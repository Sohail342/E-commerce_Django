from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .forms import  MyUserCreationForm
from django.urls import reverse

def signup(request):
    if request.method == 'POST':
       form = UserCreationForm(request.POST)
       if form.is_valid():
           user = form.save()
           login(request, user)
           return redirect(reverse("home"))
    else:
        form =  UserCreationForm()
    return render(request, 'account/signup.html', {'form': form})


def signin(request):
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(user)
            return redirect(reverse("home"))
    else:
        form = AuthenticationForm()
    return render(request, 'account/signin.html', {'form': form})


def signout(request):
    logout(request)
    return redirect('home')

