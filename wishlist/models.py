from django.db import models
from django.contrib.auth.models import User
from shop.models import Product

class WishlistItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlist_items_user')
    session_key = models.CharField(max_length=40, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['user', 'product'], ['session_key', 'product']]

    def __str__(self):
        return f"Wishlist item: {self.product.name} for {'User: ' + self.user.username if self.user else 'Session: ' + self.session_key}"