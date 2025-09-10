from django.db import models
from cloudinary.models import CloudinaryField

class Category(models.Model):
    name = models.CharField(max_length=30)
    cat_moto = models.CharField(max_length=30)
    photo = models.ImageField(upload_to='products_category')
    date = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=100)
    photo = CloudinaryField('image', blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    details = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    is_draft = models.BooleanField(default=False)
    date = models.DateTimeField(auto_now_add=True)
    inventory = models.IntegerField(default=1)
    on_sale = models.BooleanField(default=False)
    is_new = models.BooleanField(default=False)
    trending = models.BooleanField(default=False)
    sale_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    sale_start_date = models.DateTimeField(null=True, blank=True)
    sale_end_date = models.DateTimeField(null=True, blank=True)
    rating = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    @property
    def sale_price(self):
        if self.on_sale and self.sale_percentage > 0:
            discount = (self.sale_percentage / 100) * self.price
            return self.price - discount
        return self.price

    def check_sale_status(self):
        from django.utils import timezone
        if self.sale_end_date and self.on_sale:
            current_time = timezone.now()
            if self.sale_end_date <= current_time:
                self.on_sale = False
                self.sale_percentage = 0
                self.save(update_fields=['on_sale', 'sale_percentage'])
                
    def save(self, *args, **kwargs):
        self.check_sale_status()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = CloudinaryField('image', blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    alt_text = models.CharField(max_length=100, blank=True)
    order = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Image for {self.product.name}"

    def save(self, *args, **kwargs):
        # If this is marked as primary, unmark all other images for this product
        if self.is_primary:
            ProductImage.objects.filter(product=self.product, is_primary=True).update(is_primary=False)
        # If this is the first image for the product, mark it as primary
        elif not ProductImage.objects.filter(product=self.product).exists():
            self.is_primary = True
        super().save(*args, **kwargs)


from django.db.models.signals import post_init, post_save
from django.dispatch import receiver

@receiver(post_init, sender=Product)
def check_product_sale_status(sender, instance, **kwargs):
    instance.check_sale_status()

@receiver(models.signals.pre_save, sender=Product)
def update_draft_status(sender, instance, **kwargs):
    if instance.inventory == 0:
        instance.is_draft = True
        
@receiver(post_save, sender=Product)
def create_product_image_from_photo(sender, instance, created, **kwargs):
    # When a product is created, create a ProductImage from the main photo
    if created and instance.photo:
        ProductImage.objects.create(
            product=instance,
            image=instance.photo,
            is_primary=True,
            alt_text=instance.name
        )



