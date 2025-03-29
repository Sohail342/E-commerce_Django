from django.db import models
from contact.models import Contact

class ContactNotification(models.Model):
    contact = models.OneToOneField(Contact, on_delete=models.CASCADE)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.contact.name}"

    class Meta:
        ordering = ['-created_at']