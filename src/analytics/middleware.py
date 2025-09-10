from django.utils import timezone
from .models import PageView, DailyMetrics, MonthlyMetrics
from cart.models import Cart, CartItem
from django.db.models import F
from shop.models import Product
import re

class AnalyticsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Process request before view
        if not request.path.startswith('/admin/'):
            # Ensure session key exists for guest users
            if not request.session.session_key:
                request.session.create()
                
            self._process_pageview(request)
            self._update_metrics(request)

        response = self.get_response(request)
        return response

    def _process_pageview(self, request):
        session_key = request.session.session_key or ''
        # Check if this is a unique visit for this session
        is_unique = not PageView.objects.filter(
            session_key=session_key,
            timestamp__date=timezone.now().date()
        ).exists()

        # Get or create the last page view for this session
        last_pageview = PageView.objects.filter(session_key=session_key).order_by('-timestamp').first()
        
        # Determine page type and associated product
        page_type, product = self._determine_page_type_and_product(request)
        
        # Create new PageView record
        PageView.objects.create(
            path=request.path,
            user=request.user if request.user.is_authenticated else None,
            session_key=session_key,
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            referrer=request.META.get('HTTP_REFERER', None),
            is_unique=is_unique,
            session_start=last_pageview.session_start if last_pageview else timezone.now(),
            page_type=page_type,
            product=product
        )

        # Update last pageview's session end time
        if last_pageview:
            last_pageview.session_end = timezone.now()
            last_pageview.save()

    def _update_metrics(self, request):
        today = timezone.now().date()
        
        # Update or create daily metrics
        daily_metrics, _ = DailyMetrics.objects.get_or_create(date=today)
        daily_metrics.total_visits = F('total_visits') + 1
        
        if not request.session.get('counted_as_visitor'):
            daily_metrics.unique_visitors = F('unique_visitors') + 1
            request.session['counted_as_visitor'] = True
        
        daily_metrics.total_page_views = F('total_page_views') + 1
        daily_metrics.save()

        # Update or create monthly metrics
        current_month = today.month
        current_year = today.year
        monthly_metrics, _ = MonthlyMetrics.objects.get_or_create(
            year=current_year,
            month=current_month
        )
        monthly_metrics.total_visits = F('total_visits') + 1
        monthly_metrics.total_page_views = F('total_page_views') + 1
        
        if not request.session.get('counted_as_monthly_visitor'):
            monthly_metrics.unique_visitors = F('unique_visitors') + 1
            request.session['counted_as_monthly_visitor'] = True
            
        monthly_metrics.save()

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')
        
    def _determine_page_type_and_product(self, request):
        """Determine the page type and associated product (if any) based on the request path."""
        path = request.path
        product = None
        page_type = 'other'
        
        # Define patterns for different page types
        patterns = {
            'home': r'^/$',
            'shop': r'^/shop/$',
            'category': r'^/shop/category/([^/]+)/$',
            'product': r'^/shop/product/([0-9]+)/$',
            'cart': r'^/cart/$',
            'wishlist': r'^/wishlist/$',
            'checkout': r'^/order/checkout/$',
            'contact': r'^/contact/$',
            'account': r'^/account/'
        }
        
        # Check which pattern matches the current path
        for page, pattern in patterns.items():
            if re.match(pattern, path):
                page_type = page
                break
        
        # If it's a product page, extract the product ID and get the product
        if page_type == 'product':
            match = re.match(patterns['product'], path)
            if match:
                try:
                    product_id = int(match.group(1))
                    product = Product.objects.filter(id=product_id).first()
                except (ValueError, IndexError):
                    pass
        
        return page_type, product