from django.contrib import admin
from .models import Contact, Subscriber

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'subject', 'date']


@admin.register(Subscriber)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['id','email', 'date']


