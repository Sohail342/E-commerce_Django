from django.shortcuts import render
from django.contrib.auth.decorators import user_passes_test
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from order.models import Order
from shop.models import Product, Category
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, F, Avg, ExpressionWrapper, fields
from django.utils import timezone
from datetime import timedelta
from analytics.models import WishlistItem, PageView, DailyMetrics, MonthlyMetrics
from cart.models import Cart, CartItem


def is_admin(user):
    return user.is_authenticated and user.is_staff

@user_passes_test(is_admin)
def dashboard(request):
    # Get total sales and orders
    total_orders = Order.objects.count()
    total_sales = Order.objects.aggregate(total=Sum('total_price'))['total'] or 0
    
    # Get monthly sales data for chart
    monthly_sales = Order.objects.annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        total=Sum('total_price')
    ).order_by('month')
    
    # Get top selling products
    top_products = Product.objects.annotate(
        total_sold=Count('orderitem')
    ).order_by('-total_sold')[:5]
    
    # Get customer statistics
    User = get_user_model()
    total_customers = User.objects.filter(is_staff=False).count()
    recent_customers = User.objects.filter(is_staff=False).order_by('-date_joined')[:5]
    
    # Get category statistics
    categories = Category.objects.annotate(
        product_count=Count('product'),
        total_sales=Sum('product__orderitem__quantity')
    )
    
    context = {
        'total_orders': total_orders,
        'total_sales': total_sales,
        'total_customers': total_customers,
        'top_products': top_products,
        'recent_customers': recent_customers,
        'monthly_sales': monthly_sales,
        'categories': categories,
    }
    return render(request, 'dashboard/index.html', context)



@user_passes_test(is_admin)
def analytics_dashboard(request):
    # Get current date and time
    now = timezone.now()
    today = now.date()
    current_month = today.month
    current_year = today.year

    # Daily Metrics - Ensure we're getting the latest data
    daily_metrics = DailyMetrics.objects.filter(date=today).first()
    if not daily_metrics:
        daily_metrics = DailyMetrics.objects.create(date=today)
        
    # Refresh metrics from PageView data
    today_pageviews = PageView.objects.filter(timestamp__date=today)
    daily_metrics.total_visits = today_pageviews.count()
    daily_metrics.unique_visitors = today_pageviews.values('session_key').distinct().count()
    daily_metrics.total_page_views = today_pageviews.count()
    daily_metrics.save()

    # Monthly Metrics
    monthly_metrics, _ = MonthlyMetrics.objects.get_or_create(year=current_year, month=current_month)

    # Calculate average session duration
    today_sessions = PageView.objects.filter(
        timestamp__date=today,
        session_end__isnull=False
    ).values('session_key').annotate(
        duration=F('session_end') - F('session_start')
    ).aggregate(avg_duration=Avg('duration'))['avg_duration'] or timedelta()

    monthly_metrics.average_session_duration = today_sessions
    monthly_metrics.save()

    # Calculate conversion rates and trends
    cart_conversion_rate = round((daily_metrics.cart_conversions / daily_metrics.cart_adds * 100)
                                if daily_metrics.cart_adds > 0 else 0, 2)
    wishlist_conversion_rate = round((daily_metrics.wishlist_conversions / daily_metrics.wishlist_adds * 100)
                                    if daily_metrics.wishlist_adds > 0 else 0, 2)

    # Get previous day's metrics for trend calculation
    yesterday = today - timedelta(days=1)
    yesterday_metrics = DailyMetrics.objects.filter(date=yesterday).first()
    if yesterday_metrics:
        yesterday_cart_rate = (yesterday_metrics.cart_conversions / yesterday_metrics.cart_adds * 100
                              if yesterday_metrics.cart_adds > 0 else 0)
        yesterday_wishlist_rate = (yesterday_metrics.wishlist_conversions / yesterday_metrics.wishlist_adds * 100
                                  if yesterday_metrics.wishlist_adds > 0 else 0)
        cart_conversion_trend = round(cart_conversion_rate - yesterday_cart_rate, 2)
        wishlist_conversion_trend = round(wishlist_conversion_rate - yesterday_wishlist_rate, 2)
    else:
        cart_conversion_trend = 0
        wishlist_conversion_trend = 0

    # Get traffic trends data (last 30 days)
    traffic_metrics = DailyMetrics.objects.filter(
        date__gte=today - timedelta(days=30)
    ).order_by('date')

    traffic_dates = [metric.date.strftime('%Y-%m-%d') for metric in traffic_metrics]
    total_visits_data = [metric.total_visits for metric in traffic_metrics]
    unique_visitors_data = [metric.unique_visitors for metric in traffic_metrics]

    # Calculate conversion funnel data
    funnel_data = [
        PageView.objects.filter(timestamp__date=today, is_unique=True).count(),
        WishlistItem.objects.filter(added_at__date=today).count(),
        CartItem.objects.filter(added_at__date=today).count(),
        Order.objects.filter(created_at__date=today).count()
    ]

    # Get wishlist analytics
    wishlist_analytics = Product.objects.annotate(
        wishlist_count=Count('wishlist_items_analytics'),
        conversion_count=Count('wishlist_items_analytics', filter=F('wishlist_items_analytics__converted_to_cart')),
    ).filter(wishlist_count__gt=0).annotate(
        conversion_rate=ExpressionWrapper(
            F('conversion_count') * 100.0 / F('wishlist_count'),
            output_field=fields.FloatField()
        )
    ).values('name', 'wishlist_count', 'conversion_rate')

    # Get cart analytics
    cart_analytics = [
        {
            'status': 'Active',
            'count': Cart.objects.filter(cartanalytics__abandoned=False).count(),
            'value': Cart.objects.filter(cartanalytics__abandoned=False).aggregate(
                total=Sum('items__product__price'))['total'] or 0
        },
        {
            'status': 'Abandoned',
            'count': Cart.objects.filter(cartanalytics__abandoned=True).count(),
            'value': Cart.objects.filter(cartanalytics__abandoned=True).aggregate(
                total=Sum('items__product__price'))['total'] or 0
        },
        {
            'status': 'Converted',
            'count': Cart.objects.filter(cartanalytics__converted_to_order=True).count(),
            'value': Cart.objects.filter(cartanalytics__converted_to_order=True).aggregate(
                total=Sum('items__product__price'))['total'] or 0
        }
    ]

    context = {
        'daily_metrics': daily_metrics,
        'monthly_metrics': monthly_metrics,
        'cart_conversion_rate': cart_conversion_rate,
        'cart_conversion_trend': cart_conversion_trend,
        'wishlist_conversion_rate': wishlist_conversion_rate,
        'wishlist_conversion_trend': wishlist_conversion_trend,
        'traffic_dates': traffic_dates,
        'total_visits_data': total_visits_data,
        'unique_visitors_data': unique_visitors_data,
        'funnel_data': funnel_data,
        'wishlist_analytics': wishlist_analytics,
        'cart_analytics': cart_analytics
    }

    return render(request, 'dashboard/analytics.html', context)