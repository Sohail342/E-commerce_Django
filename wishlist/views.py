from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from shop.models import Product
from .models import WishlistItem

def get_wishlist_items(request):
    if request.user.is_authenticated:
        items = WishlistItem.objects.filter(user=request.user)
    else:
        items = WishlistItem.objects.filter(session_key=request.session.session_key)
    return items

@require_POST
def toggle_wishlist(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    if request.user.is_authenticated:
        item, created = WishlistItem.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={'session_key': None}
        )
        if not created:
            item.delete()
            return JsonResponse({'status': 'removed'})
    else:
        if not request.session.session_key:
            request.session.create()
        item, created = WishlistItem.objects.get_or_create(
            session_key=request.session.session_key,
            product=product,
            defaults={'user': None}
        )
        if not created:
            item.delete()
            return JsonResponse({'status': 'removed'})
    return JsonResponse({'status': 'added'})

def wishlist(request):
    items = get_wishlist_items(request)
    return render(request, 'wishlist/wishlist.html', {'wishlist_items': items})

@login_required
def sync_wishlist(request):
    if not request.session.session_key:
        return redirect('wishlist:wishlist')
    
    # Get anonymous wishlist items
    anon_items = WishlistItem.objects.filter(session_key=request.session.session_key)
    
    # Add each item to user's wishlist if not already present
    for item in anon_items:
        WishlistItem.objects.get_or_create(
            user=request.user,
            product=item.product
        )
    
    # Delete anonymous wishlist items
    anon_items.delete()
    
    return redirect('wishlist:wishlist')