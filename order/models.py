from django.db import models
from django.contrib.auth.models import User
from shop.models import Product
from cart.models import Cart


class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE)  # Changed to ForeignKey
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_paid = models.BooleanField(default=False)
    shipping_address = models.TextField(null=True, blank=True)
    payment_method = models.CharField(max_length=30, choices=[
        ('COD', 'Cash on Delivery'),
        ('Card', 'Credit/Debit Card'),
        ('PayPal', 'PayPal')
    ])
    status = models.CharField(max_length=20, choices=[
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled')
    ], default='Pending')

    def __str__(self):
        return f"Order {self.id} for {self.user.username if self.user else 'Guest'}"

    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    def total_order_price(self):
        return sum(item.total_price() for item in self.items.all())


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)  
    total_price = models.DecimalField(max_digits=10, decimal_places=2)  # Pre-calculated

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in Order {self.order.id}"

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.price
        super().save(*args, **kwargs)
