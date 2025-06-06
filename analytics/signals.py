from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.utils import timezone
from django.db.models import F
from cart.models import CartItem
from order.models import Order
from .models import CartAnalytics, DailyMetrics, MonthlyMetrics

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