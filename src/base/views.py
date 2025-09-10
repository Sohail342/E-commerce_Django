from django.shortcuts import render
from contact.models import Subscriber
from django.shortcuts import redirect
from django.contrib import messages

def subscribe(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        if email:
            if not Subscriber.objects.filter(email=email).exists():
                Subscriber.objects.create(email=email)
                messages.success(request, "Successfully subscribed.")
                # send_email(email, 'SendEmail/subscribe')
            else:
                messages.error(request, "Email is already subscribed.")
        else:
            messages.error(request, "Please provide a valid email address.")

    return redirect(request.META.get('HTTP_REFERER', '/'))


