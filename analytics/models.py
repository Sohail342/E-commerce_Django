from django.db import models
from django.contrib.auth.models import User
from shop.models import Product
from django.utils import timezone

class WishlistItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlist_items_analytics')
    added_at = models.DateTimeField(auto_now_add=True)
    converted_to_cart = models.BooleanField(default=False)
    converted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s wishlist item: {self.product.name}"

    class Meta:
        unique_together = ('user', 'product')

class CartAnalytics(models.Model):
    cart = models.OneToOneField('cart.Cart', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    abandoned = models.BooleanField(default=True)
    converted_to_order = models.BooleanField(default=False)
    conversion_time = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Cart Analytics for {self.cart}"

class PageView(models.Model):
    path = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_key = models.CharField(max_length=40)
    ip_address = models.GenericIPAddressField()
    timestamp = models.DateTimeField(auto_now_add=True)
    user_agent = models.TextField()
    referrer = models.URLField(null=True, blank=True)
    is_unique = models.BooleanField(default=True)
    session_start = models.DateTimeField(auto_now_add=True)
    session_end = models.DateTimeField(null=True, blank=True)
    session_duration = models.DurationField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if self.session_end:
            self.session_duration = self.session_end - self.session_start
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Page view: {self.path} at {self.timestamp}"

    class Meta:
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['path']),
            models.Index(fields=['session_key'])
        ]

class DailyMetrics(models.Model):
    date = models.DateField(unique=True)
    total_visits = models.PositiveIntegerField(default=0)
    unique_visitors = models.PositiveIntegerField(default=0)
    total_page_views = models.PositiveIntegerField(default=0)
    wishlist_adds = models.PositiveIntegerField(default=0)
    cart_adds = models.PositiveIntegerField(default=0)
    cart_conversions = models.PositiveIntegerField(default=0)
    wishlist_conversions = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return f"Metrics for {self.date}"

    class Meta:
        indexes = [models.Index(fields=['date'])]

class MonthlyMetrics(models.Model):
    year = models.PositiveIntegerField()
    month = models.PositiveIntegerField()
    total_visits = models.PositiveIntegerField(default=0)
    unique_visitors = models.PositiveIntegerField(default=0)
    total_page_views = models.PositiveIntegerField(default=0)
    wishlist_adds = models.PositiveIntegerField(default=0)
    cart_adds = models.PositiveIntegerField(default=0)
    cart_conversions = models.PositiveIntegerField(default=0)
    wishlist_conversions = models.PositiveIntegerField(default=0)
    average_session_duration = models.DurationField(default=timezone.timedelta())
    
    def __str__(self):
        return f"Metrics for {self.year}-{self.month}"

    class Meta:
        unique_together = ('year', 'month')
        indexes = [models.Index(fields=['year', 'month'])]