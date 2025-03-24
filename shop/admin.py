from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price', 'sale_price_display', 'category', 'inventory', 'status_display', 'date']
    list_filter = ['category', 'is_draft', 'on_sale', 'trending']
    search_fields = ['name', 'details']
    readonly_fields = ['date']
    list_editable = ['price', 'inventory']
    list_per_page = 20
    
    def sale_price_display(self, obj):
        if obj.on_sale:
            return format_html('<span style="color: green;">${}</span>', obj.sale_price)
        return format_html('${}'.format(obj.price))
    sale_price_display.short_description = 'Sale Price'
    
    def status_display(self, obj):
        if obj.is_draft:
            return format_html('<span style="color: orange;">Draft</span>')
        elif obj.inventory == 0:
            return format_html('<span style="color: red;">Out of Stock</span>')
        return format_html('<span style="color: green;">Active</span>')
    status_display.short_description = 'Status'

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'cat_moto', 'photo_preview', 'date']
    search_fields = ['name']
    readonly_fields = ['date']
    
    def photo_preview(self, obj):
        if obj.photo:
            return format_html('<img src="{}" style="width: 50px; height: 50px;" />', obj.photo.url)
        return ''
    photo_preview.short_description = 'Preview'


