document.addEventListener('DOMContentLoaded', function() {
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    const toggleWishlistButtons = document.querySelectorAll('.toggle-wishlist');
    const wishlistCount = document.querySelector('.wishlist-count');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;

    // Use the global createToast function if it exists, otherwise use a local implementation
    function showToast(message, type = 'info') {
        if (typeof window.createToast === 'function') {
            // Use the global toast function from toast.js
            window.createToast(message, type === 'success' ? 'success' : type === 'error' ? 'error' : 'warning');
        } else {
            // Fallback to local implementation
            const toast = document.createElement('div');
            toast.className = `fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-transform duration-300 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`;
            
            // Use innerHTML to support HTML in messages
            toast.innerHTML = message;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('translate-y-full', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 5000); // Increased to 5 seconds for better readability
        }
    }

    function updateWishlistCount(count) {
        if (wishlistCount) {
            wishlistCount.textContent = count;
            wishlistCount.classList.toggle('hidden', count === 0);
        }
    }

    function toggleWishlist(button, productId) {
        const isInWishlist = button.classList.contains('text-primary-600');
        const url = `/wishlist/toggle/${productId}/`;

        fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'added') {
                button.classList.add('text-primary-600');
                button.classList.remove('text-gray-400');
                // If we have a message from the server, display it
                if (data.message) {
                    showToast(data.message, 'success');
                } else {
                    showToast('Product added to wishlist', 'success');
                }
            } else if (data.status === 'removed') {
                button.classList.remove('text-primary-600');
                button.classList.add('text-gray-400');
                showToast('Product removed from wishlist', 'info');
            } else {
                showToast(data.message || 'An error occurred', 'error');
            }
            
            // Update wishlist count if available
            if (data.wishlist_count !== undefined) {
                updateWishlistCount(data.wishlist_count);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Failed to update wishlist', 'error');
        });
    }

    // Handle wishlist buttons in product listings
    wishlistButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = button.dataset.productId;
            if (!productId) {
                console.error('Product ID not found');
                return;
            }
            toggleWishlist(button, productId);
        });
    });
    
    // Handle toggle-wishlist buttons in product detail page
    toggleWishlistButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = button.dataset.productId;
            if (!productId) {
                console.error('Product ID not found');
                return;
            }
            toggleWishlist(button, productId);
        });
    });
    
    // Handle remove from wishlist buttons in wishlist page
    const removeFromWishlistButtons = document.querySelectorAll('.remove-from-wishlist');
    removeFromWishlistButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = button.dataset.productId;
            if (!productId) {
                console.error('Product ID not found');
                return;
            }
            
            const url = `/wishlist/toggle/${productId}/`;
            fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'removed') {
                    // Remove the product card from the wishlist page
                    const productCard = button.closest('.group');
                    if (productCard) {
                        productCard.classList.add('opacity-0', 'scale-95');
                        setTimeout(() => {
                            productCard.remove();
                            
                            // Check if wishlist is empty and reload if needed
                            const remainingItems = document.querySelectorAll('.remove-from-wishlist');
                            if (remainingItems.length === 0) {
                                window.location.reload();
                            }
                        }, 300);
                    }
                    
                    showToast('Product removed from wishlist', 'info');
                    
                    // Update wishlist count if available
                    if (data.wishlist_count !== undefined) {
                        updateWishlistCount(data.wishlist_count);
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Failed to remove from wishlist', 'error');
            });
        });
    });

});