from django.shortcuts import render, redirect
from django.contrib import messages
from SendEmail.views import send_email
from .forms import ContactForm, SubscriberForm


# Create your views here.
def contact_page(request):
    form = ContactForm()
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            form.save()
            email = request.POST.get('email')
            send_email(email, 'send_emails/contact.html')
            messages.add_message(request, messages.INFO, 'Submitted.')
            return redirect('contact')
    context = {
        'form': form
    }
    return render(request, 'contact/contact.html', context)

def base_page(request):
    forms = SubscriberForm()
    if request.method == 'POST':
        forms = SubscriberForm(request.POST)
        if forms.is_valid():
            forms.save()
    context = {
        'forms': forms
    }
    return render(request, 'home.html', context)