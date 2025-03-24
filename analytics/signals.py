from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.utils import timezone
from django.db.models import F
from cart.models import CartItem
from order.models import Order
from .models import WishlistItem, CartAnalytics, DailyMetrics, MonthlyMetrics

@receiver(post_save, sender=WishlistItem)
def handle_wishlist_analytics(sender, instance, created, **kwargs):
    if created:
        # Update daily metrics for wishlist adds
        today = timezone.now().date()
        daily_metrics, _ = DailyMetrics.objects.get_or_create(date=today)
        daily_metrics.wishlist_adds = F('wishlist_adds') + 1
        daily_metrics.save()

        # Update monthly metrics
        monthly_metrics, _ = MonthlyMetrics.objects.get_or_create(
            year=today.year,
            month=today.month
        )
        monthly_metrics.wishlist_adds = F('wishlist_adds') + 1
        monthly_metrics.save()

@receiver(post_save, sender=CartItem)
def handle_cart_analytics(sender, instance, created, **kwargs):
    if created:
        # Update daily metrics for cart adds
        today = timezone.now().date()
        daily_metrics, _ = DailyMetrics.objects.get_or_create(date=today)
        daily_metrics.cart_adds = F('cart_adds') + 1
        daily_metrics.save()

        # Update monthly metrics
        monthly_metrics, _ = MonthlyMetrics.objects.get_or_create(
            year=today.year,
            month=today.month
        )
        monthly_metrics.cart_adds = F('cart_adds') + 1
        monthly_metrics.save()

        # Create or update cart analytics
        CartAnalytics.objects.get_or_create(cart=instance.cart)

@receiver(post_save, sender=Order)
def handle_order_analytics(sender, instance, created, **kwargs):
    if created and instance.cart:
        # Update cart analytics
        cart_analytics = CartAnalytics.objects.get(cart=instance.cart)
        cart_analytics.abandoned = False
        cart_analytics.converted_to_order = True
        cart_analytics.conversion_time = timezone.now()
        cart_analytics.save()

        # Update daily metrics
        today = timezone.now().date()
        daily_metrics, _ = DailyMetrics.objects.get_or_create(date=today)
        daily_metrics.cart_conversions = F('cart_conversions') + 1
        daily_metrics.save()

        # Update monthly metrics
        monthly_metrics, _ = MonthlyMetrics.objects.get_or_create(
            year=today.year,
            month=today.month
        )
        monthly_metrics.cart_conversions = F('cart_conversions') + 1
        monthly_metrics.save()

        # Update wishlist conversions if items were from wishlist
        wishlist_items = WishlistItem.objects.filter(
            user=instance.user,
            product__in=instance.items.values_list('product', flat=True),
            converted_to_cart=False
        )
        if wishlist_items.exists():
            wishlist_items.update(
                converted_to_cart=True,
                converted_at=timezone.now()
            )
            daily_metrics.wishlist_conversions = F('wishlist_conversions') + wishlist_items.count()
            daily_metrics.save()
            
            monthly_metrics.wishlist_conversions = F('wishlist_conversions') + wishlist_items.count()
            monthly_metrics.save()