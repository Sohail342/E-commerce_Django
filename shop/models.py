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
    trending = models.BooleanField(default=False)
    sale_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)

    @property
    def sale_price(self):
        if self.on_sale and self.sale_percentage > 0:
            discount = (self.sale_percentage / 100) * self.price
            return self.price - discount
        return self.price

    def __str__(self):
        return self.name
