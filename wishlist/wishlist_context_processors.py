from .models import WishlistItem

def wishlist_count(request):
    if request.user.is_authenticated:
        count = WishlistItem.objects.filter(user=request.user).count()
    else:
        count = WishlistItem.objects.filter(session_key=request.session.session_key).count() if request.session.session_key else 0
    return {'wishlist_count': count}