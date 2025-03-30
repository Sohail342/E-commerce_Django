from django.contrib import admin
from django.utils.html import format_html
from import_export import resources
from import_export.admin import ImportExportModelAdmin
from import_export.fields import Field
from .models import Category, Product

# Create a resource class for Product model
class ProductResource(resources.ModelResource):
    category = Field(attribute='category', column_name='category')
    
    class Meta:
        model = Product
        fields = ('id', 'name', 'price', 'details', 'category', 'inventory', 'is_draft', 'on_sale', 'is_new', 'trending', 'sale_percentage')
        export_order = ('id', 'name', 'price', 'details', 'category', 'inventory', 'is_draft', 'on_sale', 'is_new', 'trending', 'sale_percentage')
    
    def dehydrate_category(self, product):
        return product.category.name if product.category else ''

@admin.register(Product)
class ProductAdmin(ImportExportModelAdmin):
    resource_class = ProductResource
    list_display = ['id', 'name', 'price', 'sale_price_display', 'category', 'inventory', 'status_display', 'sale_status']
    list_filter = ['category', 'is_draft', 'on_sale', 'trending']
    search_fields = ['name', 'details']
    readonly_fields = ['date']
    list_editable = ['price', 'inventory']
    list_per_page = 20
    
    def sale_status(self, obj):
        if not obj.on_sale:
            return format_html('<span style="color: gray;">Not on sale</span>')
        if obj.sale_end_date:
            from django.utils import timezone
            if obj.sale_end_date < timezone.now():
                return format_html('<span style="color: red;">Sale ended</span>')
            return format_html('<span style="color: green;">Sale ends: {}</span>', obj.sale_end_date.strftime('%Y-%m-%d %H:%M'))
        return format_html('<span style="color: green;">On sale</span>')
    
    def sale_price_display(self, obj):
        if obj.on_sale:
            return format_html('<span style="color: green;">PKR {}</span>', obj.sale_price)
        return format_html('PKR {}'.format(obj.price))
    sale_price_display.short_description = 'Sale Price'
    
    def status_display(self, obj):
        if obj.is_draft:
            return format_html('<span style="color: orange;">Draft</span>')
        elif obj.inventory == 0:
            return format_html('<span style="color: red;">Out of Stock</span>')
        return format_html('<span style="color: green;">Active</span>')
    status_display.short_description = 'Status'

# Create a resource class for Category model
class CategoryResource(resources.ModelResource):
    class Meta:
        model = Category
        fields = ('id', 'name', 'cat_moto')
        export_order = ('id', 'name', 'cat_moto')

@admin.register(Category)
class CategoryAdmin(ImportExportModelAdmin):
    resource_class = CategoryResource
    list_display = ['id', 'name', 'cat_moto', 'photo_preview', 'date']
    search_fields = ['name']
    readonly_fields = ['date']
    
    def photo_preview(self, obj):
        if obj.photo:
            return format_html('<img src="{}" style="width: 50px; height: 50px;" />', obj.photo.url)
        return ''
    photo_preview.short_description = 'Preview'


