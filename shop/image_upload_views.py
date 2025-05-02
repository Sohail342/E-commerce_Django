
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import Product, ProductImage
from .forms import ProductImageFormSet, MultipleImageUploadForm

@login_required
def manage_product_images(request, product_id):
    """
    View for managing product images using a formset
    """
    product = get_object_or_404(Product, id=product_id)
    
    if request.method == 'POST':
        formset = ProductImageFormSet(request.POST, request.FILES, instance=product)
        if formset.is_valid():
            formset.save()
            messages.success(request, 'Product images updated successfully.')
            return redirect('shop:product_detail', product_id=product.id)
    else:
        formset = ProductImageFormSet(instance=product)
    
    context = {
        'product': product,
        'formset': formset,
    }
    return render(request, 'shop/manage_product_images.html', context)

@login_required
def upload_multiple_images(request, product_id):
    """
    View for uploading multiple images at once
    """
    product = get_object_or_404(Product, id=product_id)
    
    if request.method == 'POST':
        form = MultipleImageUploadForm(request.POST, request.FILES)
        if form.is_valid():
            images = request.FILES.getlist('images')
            
            # Get the highest current order value
            last_order = ProductImage.objects.filter(product=product).order_by('-order').first()
            next_order = 1 if not last_order else last_order.order + 1
            
            # Process each uploaded image
            for i, image_file in enumerate(images):
                # Set the first image as primary if no images exist yet
                is_primary = False
                if i == 0 and not ProductImage.objects.filter(product=product).exists():
                    is_primary = True
                
                # Create the product image
                ProductImage.objects.create(
                    product=product,
                    image=image_file,
                    is_primary=is_primary,
                    alt_text=f"{product.name} - Image {next_order + i}",
                    order=next_order + i
                )
            
            messages.success(request, f'{len(images)} images uploaded successfully.')
            return redirect('shop:product_detail', product_id=product.id)
    else:
        form = MultipleImageUploadForm()
    
    context = {
        'product': product,
        'form': form,
    }
    return render(request, 'shop/upload_multiple_images.html', context)

@require_POST
def ajax_upload_image(request, product_id):
    """
    AJAX endpoint for uploading a single image
    """
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=403)
    
    product = get_object_or_404(Product, id=product_id)
    
    if 'image' not in request.FILES:
        return JsonResponse({'status': 'error', 'message': 'No image provided'}, status=400)
    
    image_file = request.FILES['image']
    
    # Validate file type
    if not image_file.content_type.startswith('image'):
        return JsonResponse({'status': 'error', 'message': 'File type not supported'}, status=400)
    
    # Validate file size (limit to 5MB)
    if image_file.size > 5 * 1024 * 1024:  # 5MB in bytes
        return JsonResponse({'status': 'error', 'message': 'Image file too large'}, status=400)
    
    # Get the next order value
    last_order = ProductImage.objects.filter(product=product).order_by('-order').first()
    next_order = 1 if not last_order else last_order.order + 1
    
    # Set as primary if it's the first image
    is_primary = not ProductImage.objects.filter(product=product).exists()
    
    # Create the product image
    image = ProductImage.objects.create(
        product=product,
        image=image_file,
        is_primary=is_primary,
        alt_text=request.POST.get('alt_text', f"{product.name} - Image {next_order}"),
        order=next_order
    )
    
    # Return success response with image details
    return JsonResponse({
        'status': 'success',
        'message': 'Image uploaded successfully',
        'image': {
            'id': image.id,
            'url': image.image.url,
            'is_primary': image.is_primary,
            'alt_text': image.alt_text,
            'order': image.order
        }
    })