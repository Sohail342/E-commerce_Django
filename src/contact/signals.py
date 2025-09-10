from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Contact
from dashboard.models import ContactNotification

@receiver(post_save, sender=Contact)
def create_contact_notification(sender, instance, created, **kwargs):
    """Create a notification when a new contact form is submitted"""
    if created:
        ContactNotification.objects.create(contact=instance)