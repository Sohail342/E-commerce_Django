from django.shortcuts import render
from contact.models import Subscriber

def base(request):
    message = ''  
    if request.method == 'POST':
        email = request.POST.get('email')
        if email:
            if not Subscriber.objects.filter(email=email).exists():
                Subscriber.objects.create(email=email)
                message = "Successfully subscribed."
            else:
                message = "Email is already subscribed."
        else:
            message = "Please provide a valid email address."

    return render(request, 'base.html', {'message': message})
