from django.shortcuts import get_object_or_404, render
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from .models import Category, Product



def shop_page(request):
    category = Category.objects.all()
    product_list = Product.objects.filter(is_draft=False)
    
    # Handle price sorting
    sort_by = request.GET.get('sort', None)
    if sort_by == 'price_low_high':
        product_list = product_list.order_by('price')
    elif sort_by == 'price_high_low':
        product_list = product_list.order_by('-price')
    else:
        product_list = product_list.order_by('-id')
        
    sale_products = Product.objects.filter(is_draft=False, on_sale=True, sale_percentage__gte=50).order_by('-sale_percentage')[:8]
    
    # Set pagination with 12 items per page
    paginator = Paginator(product_list, 12)
    page = request.GET.get('page')
    
    try:
        products = paginator.page(page)
    except PageNotAnInteger:
        products = paginator.page(1)
    except EmptyPage:
        products = paginator.page(paginator.num_pages)
    
    context = {
        'category': category,
        'products': products,
        'sale_products': sale_products,
        'is_paginated': True if paginator.num_pages > 1 else False,
        'total_products': product_list.count()
    }

    return render(request, 'shop/shop.html', context)




def product_detail(request, product_id):
    product_details = Product.objects.get(id=product_id, is_draft=False)
    ctg = Category.objects.get(name=product_details.category)
    invertory = product_details.inventory
    
    # Get related products from the same category, excluding current product
    related_products = Product.objects.filter(
        category=ctg,
        is_draft=False
    ).exclude(id=product_id).order_by('?')[:4]
    
    context = {
        'product': product_details,
        'category': ctg,
        'inventory': invertory,
        'related_products': related_products,
    }
    return render(request, 'shop/product-detail.html', context)




def category(request, category_name):
    category = get_object_or_404(Category, name=category_name)
    all_categories = Category.objects.all()
    
    product_list = Product.objects.filter(category=category, is_draft=False)
    
    # Handle price sorting
    sort_by = request.GET.get('sort', None)
    if sort_by == 'price_low_high':
        product_list = product_list.order_by('price')
    elif sort_by == 'price_high_low':
        product_list = product_list.order_by('-price')
    else:
        product_list = product_list.order_by('-id')
    
    # Set pagination with 12 items per page
    paginator = Paginator(product_list, 12)
    page = request.GET.get('page')
    
    try:
        products = paginator.page(page)
    except PageNotAnInteger:
        products = paginator.page(1)
    except EmptyPage:
        products = paginator.page(paginator.num_pages)
    
    return render(request, "shop/category.html", {
        'category': category,
        'all_categories': all_categories,
        'products': products,
        'is_paginated': True if paginator.num_pages > 1 else False
    })