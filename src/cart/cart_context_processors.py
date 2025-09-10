from .models import Cart
from .cart_session import SessionCart

def cart_item_count(request):
    user = getattr(request, 'user', None)
    if user and user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
        return {'cart_item_count': cart.items.count()}
    else:
        cart = SessionCart(request)
        return {'cart_item_count': len(cart.cart)}
