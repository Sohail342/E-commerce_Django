from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=30)
    cat_moto = models.CharField(max_length=30)
    photo = models.ImageField(upload_to='products_category')
    date = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=100)
    photo = models.ImageField(upload_to='products')
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

from django.db.models.signals import post_init
from django.dispatch import receiver

@receiver(post_init, sender=Product)
def check_product_sale_status(sender, instance, **kwargs):
    instance.check_sale_status()

    @receiver(models.signals.pre_save, sender=Product)
    def update_draft_status(sender, instance, **kwargs):
        if instance.inventory == 0:
            instance.is_draft = True
    def save(self, *args, **kwargs):
        self.check_sale_status()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name



