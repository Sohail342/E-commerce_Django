from django.contrib import admin
from .models import Category, Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price', 'category', 'inventory', 'date']

@admin.register(Category)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name','date']


