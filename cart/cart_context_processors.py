from .models import Cart
from .cart_session import SessionCart

def cart_item_count(request):
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
        return {'cart_item_count': cart.items.count()}
    else:
        cart = SessionCart(request)
        return {'cart_item_count': sum(item['quantity'] for item in cart.cart.values())}
