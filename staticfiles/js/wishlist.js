document.addEventListener('DOMContentLoaded', function() {
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    const wishlistCount = document.querySelector('.wishlist-count');

    function createToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-transform duration-300 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function updateWishlistCount(count) {
        if (wishlistCount) {
            wishlistCount.textContent = count;
            wishlistCount.classList.toggle('hidden', count === 0);
        }
    }

    function toggleWishlist(button, productId) {
        const isInWishlist = button.classList.contains('text-primary-600');
        const url = isInWishlist ? `/wishlist/remove/${productId}/` : `/wishlist/add/${productId}/`;

        fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                button.classList.toggle('text-primary-600');
                button.classList.toggle('text-gray-400');
                updateWishlistCount(data.wishlist_count);
                createToast(data.message, 'success');
            } else {
                createToast(data.message || 'An error occurred', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            createToast('Failed to update wishlist', 'error');
        });
    }

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
});