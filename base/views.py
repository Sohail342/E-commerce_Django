from django.shortcuts import render
from contact.models import Subscriber
from SendEmail.views import send_email

def base(request):
    message = ''  
    if request.method == 'POST':
        email = request.POST.get('email')
        if email:
            if not Subscriber.objects.filter(email=email).exists():
                Subscriber.objects.create(email=email)
                message = "Successfully subscribed."
                send_email(email, 'send_emails/subscribe')
            else:
                message = "Email is already subscribed."
        else:
            message = "Please provide a valid email address."

    return render(request, 'base/subscribe.html', {'message': message})


