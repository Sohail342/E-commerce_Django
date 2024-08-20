from django.shortcuts import render, redirect
from .models import Review

def reviews_view(request):
    if request.method == "POST":
        customer_name = request.POST.get('customer_name')
        rating = request.POST.get('rating')
        review_text = request.POST.get('review_text')

        # Save the review to the database
        Review.objects.create(customer_name=customer_name, rating=rating, review_text=review_text)

        return redirect('about:about')

    # Get existing reviews
    reviews = Review.objects.all()

    return render(request, 'about/about.html', {'reviews': reviews})


def Shipping_information(request):
    return render(request, 'footer_links/shipping.html')


def Other_details(request):
    return render(request, 'footer_links/other_details.html')
