from django.contrib import admin
from .models import Review

# Register your models here.
@admin.register(Review)
class ReviewAdminModel(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'rating', 'review_text')