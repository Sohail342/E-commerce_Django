from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from shop.models import Product
from .models import WishlistItem
from django.contrib import messages
from django.urls import reverse

def get_wishlist_items(request):
    if request.user.is_authenticated:
        items = WishlistItem.objects.filter(user=request.user)
    else:
        items = WishlistItem.objects.filter(session_key=request.session.session_key)
    return items

@require_POST
def toggle_wishlist(request, product_id):
    wishlist_url = reverse('wishlist:wishlist')
    product = get_object_or_404(Product, id=product_id)
    
    # Get wishlist count before operation
    if request.user.is_authenticated:
        initial_count = WishlistItem.objects.filter(user=request.user).count()
    else:
        initial_count = WishlistItem.objects.filter(session_key=request.session.session_key).count() if request.session.session_key else 0
    
    if request.user.is_authenticated:
        item, created = WishlistItem.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={'session_key': None}
        )
        if created:
            message = f"{product.name} has been added to your wishlist. <a href='{wishlist_url}' class='flex-1 mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300 flex items-center justify-center'>View Wishlist</a>"
            # Get updated count
            wishlist_count = WishlistItem.objects.filter(user=request.user).count()
            return JsonResponse({
                'status': 'added', 
                'message': message,
                'wishlist_count': wishlist_count
            })
        else:
            item.delete()
            # Get updated count
            wishlist_count = WishlistItem.objects.filter(user=request.user).count()
            return JsonResponse({
                'status': 'removed',
                'wishlist_count': wishlist_count
            })
    else:
        if not request.session.session_key:
            request.session.create()
        item, created = WishlistItem.objects.get_or_create(
            session_key=request.session.session_key,
            product=product,
            defaults={'user': None}
        )
        if created:
            message = f"{product.name} has been added to your wishlist. <a href='{wishlist_url}' class='flex-1 mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300 flex items-center justify-center'>View Wishlist</a>"
            # Get updated count
            wishlist_count = WishlistItem.objects.filter(session_key=request.session.session_key).count()
            return JsonResponse({
                'status': 'added', 
                'message': message,
                'wishlist_count': wishlist_count
            })
        else:
            item.delete()
            # Get updated count
            wishlist_count = WishlistItem.objects.filter(session_key=request.session.session_key).count()
            return JsonResponse({
                'status': 'removed',
                'wishlist_count': wishlist_count
            })


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