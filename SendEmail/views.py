from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings

def send_welcome_email(user_email, message_HTML):
    subject = 'Welcome to My Project'
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user_email]
    
    # Use a Django template to render HTML content
    html_content = render_to_string(message_HTML, {'user_email': user_email})
    
    email = EmailMessage(subject, '', from_email, recipient_list)
    email.content_subtype = "html"
    email.body = html_content
    try:
        email.send()
    except Exception as e:
        print("Failed to Send")    # For debug purpose
