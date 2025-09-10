from django.shortcuts import render
from django.contrib.auth.decorators import user_passes_test
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from order.models import Order
from shop.models import Product, Category
from django.contrib.auth import get_user_model
from django.db.models import Max, Count, Sum, F, Avg, ExpressionWrapper, fields, Q, Subquery, IntegerField, Func, Value
from django.db.models.functions import Cast, Substr, Length
from django.utils import timezone
from datetime import timedelta
import json
from analytics.models import PageView, DailyMetrics, MonthlyMetrics
from cart.models import Cart, CartItem


def is_admin(user):
    return user.is_authenticated and user.is_staff

@user_passes_test(is_admin)
def dashboard(request):
    # Get total sales and orders
    total_orders = Order.objects.count()
    total_sales = Order.objects.aggregate(total=Sum('total_price'))['total'] or 0
    
    # Calculate total sales for current month
    current_month = timezone.now().month
    current_year = timezone.now().year
    monthly_sales_total = Order.objects.filter(
        created_at__month=current_month,
        created_at__year=current_year
    ).aggregate(total=Sum('total_price'))['total'] or 0
    
    # Calculate previous month's sales for comparison
    previous_month = current_month - 1 if current_month > 1 else 12
    previous_year = current_year if current_month > 1 else current_year - 1
    previous_month_sales = Order.objects.filter(
        created_at__month=previous_month,
        created_at__year=previous_year
    ).aggregate(total=Sum('total_price'))['total'] or 0
    
    # Calculate percentage change
    if previous_month_sales > 0:
        percentage_change = ((monthly_sales_total - previous_month_sales) / previous_month_sales) * 100
    else:
        percentage_change = 100 if monthly_sales_total > 0 else 0
    
    # Get contact notifications
    from dashboard.models import ContactNotification
    contact_notifications = ContactNotification.objects.all()[:5]
    
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
        'monthly_sales_total': monthly_sales_total,
        'percentage_change': percentage_change,
        'contact_notifications': contact_notifications,
    }
    return render(request, 'dashboard/index.html', context)



@user_passes_test(is_admin)
def product_analytics(request):
    # Get current date and time
    now = timezone.now()
    today = now.date()
    
    # Get total products count
    total_products = Product.objects.count()
    
    # Get low stock and out of stock products
    low_stock_threshold = 10  # Define threshold for low stock
    low_stock_count = Product.objects.filter(inventory__gt=0, inventory__lte=low_stock_threshold).count()
    out_of_stock_count = Product.objects.filter(inventory=0).count()
    
    # Get category count
    category_count = Category.objects.count()
    
    # Get top selling products
    top_selling_products = Product.objects.annotate(
        units_sold=Count('orderitem'),
        revenue=Sum(F('orderitem__quantity') * F('price'))
    ).filter(units_sold__gt=0).order_by('-units_sold')[:10]
    
    # Format for template
    top_selling_products_data = [
        {
            'name': product.name,
            'units_sold': product.units_sold,
            'revenue': product.revenue or 0
        } for product in top_selling_products
    ]
    
    # Get most viewed products - using path to identify product views
    # Extract product IDs from paths like '/product/123/' using regex
    most_viewed_products = Product.objects.annotate(
        view_count=Count('id', filter=Q(id__in=Subquery(
            PageView.objects.filter(path__regex=r'^/product/\d+/$')
            .annotate(extracted_product_id=Cast(Substr('path', 10, Length('path') - 11), output_field=IntegerField()))
            .values('extracted_product_id')
        ))),
        purchase_count=Count('orderitem')
    ).filter(view_count__gt=0).order_by('-view_count')[:10]
    
    # Calculate conversion rates
    most_viewed_products_data = []
    for product in most_viewed_products:
        conversion_rate = (product.purchase_count / product.view_count * 100) if product.view_count > 0 else 0
        most_viewed_products_data.append({
            'name': product.name,
            'view_count': product.view_count,
            'conversion_rate': round(conversion_rate, 2)
        })
    
    # Get inventory status
    inventory_status = Product.objects.annotate(
        category_name=F('category__name')
    ).values('id', 'name', 'inventory', 'category_name')
    
    # Format for template
    inventory_status_data = [
        {
            'name': product['name'],
            'stock': product['inventory'],
            'category': product['category_name'],
            'stock_threshold': low_stock_threshold
        } for product in inventory_status
    ]
    
    # Prepare chart data
    top_products_names = [product['name'] for product in top_selling_products_data[:5]]
    top_products_units = [product['units_sold'] for product in top_selling_products_data[:5]]
    
    # Get product views trend (last 30 days)
    thirty_days_ago = today - timedelta(days=30)
    product_views = PageView.objects.filter(
        timestamp__gte=thirty_days_ago,
        path__regex=r'^/product/\d+/$'  # Filter paths that match product detail pages
    ).annotate(
        date=TruncMonth('timestamp')
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')
    
    product_view_dates = [view['date'].strftime('%Y-%m-%d') for view in product_views]
    product_view_counts = [view['count'] for view in product_views]
    
    context = {
        'total_products': total_products,
        'low_stock_count': low_stock_count,
        'out_of_stock_count': out_of_stock_count,
        'category_count': category_count,
        'top_selling_products': top_selling_products_data,
        'most_viewed_products': most_viewed_products_data,
        'inventory_status': inventory_status_data,
        'top_products_names': top_products_names,
        'top_products_units': top_products_units,
        'product_view_dates': product_view_dates,
        'product_view_counts': product_view_counts,
        'contact_notifications': getattr(request, 'contact_notifications', None),
        'analytics_type': 'product'
    }
    
    return render(request, 'dashboard/product_analytics.html', context)

@user_passes_test(is_admin)
def customer_analytics(request):
    # Get current date and time
    now = timezone.now()
    today = now.date()
    
    # Get user model
    User = get_user_model()
    
    # Get total customers count
    total_customers = User.objects.filter(is_staff=False).count()
    
    # Get new customers (last 30 days)
    thirty_days_ago = today - timedelta(days=30)
    new_customers_count = User.objects.filter(
        is_staff=False,
        date_joined__gte=thirty_days_ago
    ).count()
    
    # Get active customers (purchased in last 90 days)
    ninety_days_ago = today - timedelta(days=90)
    active_customers_count = User.objects.filter(
        is_staff=False,
        order__created_at__gte=ninety_days_ago
    ).distinct().count()
    
    # Calculate average customer value
    avg_customer_value = Order.objects.values('user').annotate(
        total_spent=Sum('total_price')
    ).aggregate(avg_value=Avg('total_spent'))['avg_value'] or 0
    
    # Calculate repeat purchase rate
    customers_with_orders = User.objects.filter(
        is_staff=False,
        order__isnull=False
    ).distinct().count()
    
    customers_with_multiple_orders = User.objects.filter(
        is_staff=False
    ).annotate(
        order_count=Count('order')
    ).filter(order_count__gt=1).count()
    
    repeat_purchase_rate = (customers_with_multiple_orders / customers_with_orders * 100) if customers_with_orders > 0 else 0
    
    # Calculate previous period for comparison
    prev_ninety_days_ago = ninety_days_ago - timedelta(days=90)
    prev_period_customers_with_orders = User.objects.filter(
        is_staff=False,
        order__created_at__gte=prev_ninety_days_ago,
        order__created_at__lt=ninety_days_ago
    ).distinct().count()
    
    prev_period_customers_with_multiple_orders = User.objects.filter(
        is_staff=False,
        order__created_at__gte=prev_ninety_days_ago,
        order__created_at__lt=ninety_days_ago
    ).annotate(
        order_count=Count('order')
    ).filter(order_count__gt=1).count()
    
    prev_repeat_purchase_rate = (prev_period_customers_with_multiple_orders / prev_period_customers_with_orders * 100) if prev_period_customers_with_orders > 0 else 0
    repeat_purchase_trend = repeat_purchase_rate - prev_repeat_purchase_rate
    
    # Calculate retention rate
    prev_active_customers = User.objects.filter(
        is_staff=False,
        order__created_at__gte=prev_ninety_days_ago,
        order__created_at__lt=ninety_days_ago
    ).distinct()
    
    retained_customers = prev_active_customers.filter(
        order__created_at__gte=ninety_days_ago
    ).distinct().count()
    
    retention_rate = (retained_customers / prev_active_customers.count() * 100) if prev_active_customers.count() > 0 else 0
    
    # Previous retention rate for trend
    prev_prev_ninety_days_ago = prev_ninety_days_ago - timedelta(days=90)
    prev_prev_active_customers = User.objects.filter(
        is_staff=False,
        order__created_at__gte=prev_prev_ninety_days_ago,
        order__created_at__lt=prev_prev_ninety_days_ago + timedelta(days=90)
    ).distinct()
    
    prev_retained_customers = prev_prev_active_customers.filter(
        order__created_at__gte=prev_ninety_days_ago,
        order__created_at__lt=ninety_days_ago
    ).distinct().count()
    
    prev_retention_rate = (prev_retained_customers / prev_prev_active_customers.count() * 100) if prev_prev_active_customers.count() > 0 else 0
    retention_trend = retention_rate - prev_retention_rate
    
    # Calculate average orders per customer
    avg_orders_per_customer = Order.objects.values('user').annotate(
        order_count=Count('id')
    ).aggregate(avg_orders=Avg('order_count'))['avg_orders'] or 0
    
    # Previous period for trend
    prev_avg_orders_per_customer = Order.objects.filter(
        created_at__gte=prev_ninety_days_ago,
        created_at__lt=ninety_days_ago
    ).values('user').annotate(
        order_count=Count('id')
    ).aggregate(avg_orders=Avg('order_count'))['avg_orders'] or 0
    
    orders_per_customer_trend = ((avg_orders_per_customer - prev_avg_orders_per_customer) / prev_avg_orders_per_customer * 100) if prev_avg_orders_per_customer > 0 else 0
    
    # Get top customers by value
    top_customers_by_value = User.objects.filter(is_staff=False).annotate(
        total_spent=Sum('order__total_price'),
        order_count=Count('order')
    ).filter(total_spent__gt=0).order_by('-total_spent')[:10]
    
    top_customers_by_value_data = [
        {
            'name': f"{user.first_name} {user.last_name}" if user.first_name else user.username,
            'order_count': user.order_count,
            'total_spent': user.total_spent or 0
        } for user in top_customers_by_value
    ]
    
    # Get top customers by frequency
    top_customers_by_frequency = User.objects.filter(is_staff=False).annotate(
        order_count=Count('order'),
        last_purchase=Max('order__created_at')
    ).filter(order_count__gt=0).order_by('-order_count')[:10]
    
    top_customers_by_frequency_data = [
        {
            'name': f"{user.first_name} {user.last_name}" if user.first_name else user.username,
            'order_count': user.order_count,
            'last_purchase': user.last_purchase
        } for user in top_customers_by_frequency
    ]
    
    # Get recent customers
    recent_customers = User.objects.filter(is_staff=False).annotate(
        order_count=Count('order'),
        total_spent=Sum('order__total_price')
    ).order_by('-date_joined')[:10]
    
    recent_customers_data = [
        {
            'name': f"{user.first_name} {user.last_name}" if user.first_name else user.username,
            'joined': user.date_joined,
            'order_count': user.order_count,
            'total_spent': user.total_spent or 0
        } for user in recent_customers
    ]
    
    # Customer growth data for chart
    customer_growth = User.objects.filter(
        is_staff=False,
        date_joined__gte=today - timedelta(days=365)
    ).annotate(
        month=TruncMonth('date_joined')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    growth_labels = [month['month'].strftime('%b %Y') for month in customer_growth]
    growth_data = [month['count'] for month in customer_growth]
    
    # Customer segments data for chart
    from decimal import Decimal
    high_value_threshold = avg_customer_value * Decimal('2')
    low_value_threshold = avg_customer_value * Decimal('0.5')
    
    high_value_customers = User.objects.filter(is_staff=False).annotate(
        total_spent=Sum('order__total_price')
    ).filter(total_spent__gt=high_value_threshold).count()
    
    medium_value_customers = User.objects.filter(is_staff=False).annotate(
        total_spent=Sum('order__total_price')
    ).filter(total_spent__lte=high_value_threshold, total_spent__gt=low_value_threshold).count()
    
    low_value_customers = User.objects.filter(is_staff=False).annotate(
        total_spent=Sum('order__total_price')
    ).filter(total_spent__lte=low_value_threshold, total_spent__gt=0).count()
    
    no_purchase_customers = User.objects.filter(is_staff=False).annotate(
        order_count=Count('order')
    ).filter(order_count=0).count()
    
    segment_labels = ['High Value', 'Medium Value', 'Low Value', 'No Purchase']
    segment_data = [high_value_customers, medium_value_customers, low_value_customers, no_purchase_customers]
    
    context = {
        'total_customers': total_customers,
        'new_customers_count': new_customers_count,
        'active_customers_count': active_customers_count,
        'avg_customer_value': avg_customer_value,
        'repeat_purchase_rate': repeat_purchase_rate,
        'repeat_purchase_trend': repeat_purchase_trend,
        'retention_rate': retention_rate,
        'retention_trend': retention_trend,
        'avg_orders_per_customer': avg_orders_per_customer,
        'orders_per_customer_trend': orders_per_customer_trend,
        'top_customers_by_value': top_customers_by_value_data,
        'top_customers_by_frequency': top_customers_by_frequency_data,
        'recent_customers': recent_customers_data,
        'growth_labels': growth_labels,
        'growth_data': growth_data,
        'segment_labels': segment_labels,
        'segment_data': segment_data,
        'contact_notifications': getattr(request, 'contact_notifications', None),
        'analytics_type': 'customer'
    }
    
    return render(request, 'dashboard/customer_analytics.html', context)

@user_passes_test(is_admin)
def sales_analytics(request):
    # Get current date and time
    now = timezone.now()
    today = now.date()
    current_month = today.month
    current_year = today.year
    
    # Calculate date ranges
    yesterday = today - timedelta(days=1)
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    year_ago = today - timedelta(days=365)
    
    # Get total sales
    total_sales = Order.objects.aggregate(total=Sum('total_price'))['total'] or 0
    
    # Get today's sales
    today_sales = Order.objects.filter(
        created_at__date=today
    ).aggregate(total=Sum('total_price'))['total'] or 0
    
    # Get weekly sales (last 7 days)
    weekly_sales = Order.objects.filter(
        created_at__date__gte=week_ago
    ).aggregate(total=Sum('total_price'))['total'] or 0
    
    # Get monthly sales (current month)
    monthly_sales = Order.objects.filter(
        created_at__month=current_month,
        created_at__year=current_year
    ).aggregate(total=Sum('total_price'))['total'] or 0
    
    # Get yearly sales (current year)
    yearly_sales = Order.objects.filter(
        created_at__year=current_year
    ).aggregate(total=Sum('total_price'))['total'] or 0
    
    # Calculate growth rates
    # Monthly growth
    previous_month = current_month - 1 if current_month > 1 else 12
    previous_month_year = current_year if current_month > 1 else current_year - 1
    
    previous_month_sales = Order.objects.filter(
        created_at__month=previous_month,
        created_at__year=previous_month_year
    ).aggregate(total=Sum('total_price'))['total'] or 0
    
    monthly_growth = ((monthly_sales - previous_month_sales) / previous_month_sales * 100) if previous_month_sales > 0 else 0
    
    # Weekly growth
    previous_week_sales = Order.objects.filter(
        created_at__date__gte=week_ago - timedelta(days=7),
        created_at__date__lt=week_ago
    ).aggregate(total=Sum('total_price'))['total'] or 0
    
    weekly_growth = ((weekly_sales - previous_week_sales) / previous_week_sales * 100) if previous_week_sales > 0 else 0
    
    # Calculate average order value
    average_order_value = Order.objects.aggregate(
        avg_value=Avg('total_price')
    )['avg_value'] or 0
    
    # Previous period AOV for comparison
    previous_period_aov = Order.objects.filter(
        created_at__date__lt=month_ago
    ).aggregate(avg_value=Avg('total_price'))['avg_value'] or 0
    
    aov_growth = ((average_order_value - previous_period_aov) / previous_period_aov * 100) if previous_period_aov > 0 else 0
    
    # Get monthly sales trend data
    monthly_sales_trend = Order.objects.filter(
        created_at__date__gte=year_ago
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        total=Sum('total_price')
    ).order_by('month')
    
    monthly_labels = [month['month'].strftime('%b %Y') for month in monthly_sales_trend]
    monthly_data = [float(month['total']) for month in monthly_sales_trend]
    
    # Get weekly sales breakdown
    days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    weekly_breakdown = [0] * 7
    
    # Get data for the last 4 weeks to have a meaningful weekly pattern
    four_weeks_ago = today - timedelta(days=28)
    weekly_orders = Order.objects.filter(created_at__date__gte=four_weeks_ago)
    
    for order in weekly_orders:
        # Get day of week (0 = Monday, 6 = Sunday)
        day_of_week = order.created_at.weekday()
        weekly_breakdown[day_of_week] += float(order.total_price)
    
    # Average it out over 4 weeks
    weekly_breakdown = [amount / 4 for amount in weekly_breakdown]
    
    # Get top selling products
    top_selling_products = Product.objects.annotate(
        units_sold=Count('orderitem'),
        revenue=Sum(F('orderitem__quantity') * F('price'))
    ).filter(units_sold__gt=0).order_by('-units_sold')[:10]
    
    top_selling_products_data = [
        {
            'name': product.name,
            'units_sold': product.units_sold,
            'revenue': product.revenue or 0
        } for product in top_selling_products
    ]
    
    # Get sales by category
    sales_by_category = Category.objects.annotate(
        product_count=Count('product', distinct=True),
        revenue=Sum(F('product__orderitem__quantity') * F('product__price'))
    ).filter(revenue__gt=0).order_by('-revenue')
    
    sales_by_category_data = [
        {
            'name': category.name,
            'product_count': category.product_count,
            'revenue': category.revenue or 0
        } for category in sales_by_category
    ]
    
    # Get recent orders
    recent_orders = Order.objects.select_related('user').order_by('-created_at')[:10]
    
    context = {
        'total_sales': total_sales,
        'today_sales': today_sales,
        'weekly_sales': weekly_sales,
        'monthly_sales': monthly_sales,
        'yearly_sales': yearly_sales,
        'monthly_growth': monthly_growth,
        'weekly_growth': weekly_growth,
        'average_order_value': average_order_value,
        'aov_growth': aov_growth,
        'monthly_labels': monthly_labels,
        'monthly_data': monthly_data,
        'days_of_week': days_of_week,
        'weekly_breakdown': weekly_breakdown,
        'top_selling_products': top_selling_products_data,
        'sales_by_category': sales_by_category_data,
        'recent_orders': recent_orders,
        'today': today,
        'current_month_name': today.strftime('%B'),
        'current_year': current_year,
        'contact_notifications': getattr(request, 'contact_notifications', None),
        'analytics_type': 'sales'
    }
    
    return render(request, 'dashboard/sales_analytics.html', context)

@user_passes_test(is_admin)
def mark_notification_read(request, notification_id):
    """Mark a notification as read and redirect back to the referring page"""
    from dashboard.models import ContactNotification
    from django.shortcuts import redirect, get_object_or_404
    from django.http import JsonResponse
    
    notification = get_object_or_404(ContactNotification, id=notification_id)
    notification.is_read = True
    notification.save()
    
    # Check if it's an AJAX request
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'status': 'success'})
    
    # If not AJAX, redirect back to the referring page
    referer = request.META.get('HTTP_REFERER', '/')
    return redirect(referer)

@user_passes_test(is_admin)
def advance_analytics_dashboard(request):
    # Get contact notifications
    from dashboard.models import ContactNotification
    contact_notifications = ContactNotification.objects.all()[:5]
    
    # Get analytics type from query parameters
    analytics_type = request.GET.get('type', 'general')
    
    # Add contact_notifications to request to make it available in all views
    request.contact_notifications = contact_notifications
    
    # Get current date and time
    now = timezone.now()
    today = now.date()
    current_month = today.month
    current_year = today.year
    
    # Handle different analytics types
    if analytics_type == 'product':
        return product_analytics(request)
    elif analytics_type == 'customer':
        return customer_analytics(request)
    elif analytics_type == 'sales':
        return sales_analytics(request)
    else:
        # Default general analytics
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

        # Format data for JavaScript charts
        traffic_dates = json.dumps([metric.date.strftime('%Y-%m-%d') for metric in traffic_metrics])
        total_visits_data = json.dumps([metric.total_visits for metric in traffic_metrics])
        unique_visitors_data = json.dumps([metric.unique_visitors for metric in traffic_metrics])

        # Calculate conversion funnel data
        # Calculate conversion funnel data with improved accuracy
        funnel_data = [
            PageView.objects.filter(timestamp__date=today, is_unique=True).count(),
            PageView.objects.filter(timestamp__date=today, page_type='wishlist').count(),
            PageView.objects.filter(timestamp__date=today, page_type='cart').count(),
            Order.objects.filter(created_at__date=today).count()
        ]
        
        # Convert to JSON for JavaScript
        funnel_data = json.dumps(funnel_data)

        # Get wishlist analytics with improved calculation
        wishlist_analytics = Product.objects.annotate(
            wishlist_count=Count('wishlist_items_analytics'),
            conversion_count=Count('wishlist_items_analytics', filter=F('wishlist_items_analytics__converted_to_cart')),
        ).filter(wishlist_count__gt=0).annotate(
            conversion_rate=ExpressionWrapper(
                F('conversion_count') * 100.0 / F('wishlist_count'),
                output_field=fields.FloatField()
            )
        ).values('name', 'wishlist_count', 'conversion_count', 'conversion_rate')
        
        # Ensure conversion_rate is properly formatted
        wishlist_analytics = [{
            'name': item['name'],
            'wishlist_count': item['wishlist_count'],
            'conversion_count': item['conversion_count'],
            'conversion_rate': round(item['conversion_rate'], 2) if item['conversion_rate'] is not None else 0
        } for item in wishlist_analytics]

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
            'cart_analytics': cart_analytics,
            'contact_notifications': getattr(request, 'contact_notifications', None),
        }
        return render(request, 'dashboard/analytics.html', context)