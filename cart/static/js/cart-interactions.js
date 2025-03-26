document.addEventListener('DOMContentLoaded', function() {
    // Initialize with zero total
    const totalElement = document.querySelector('.cart-total');
    if (totalElement) {
        totalElement.textContent = 'PKR 0.0';
    }

    // Function to update cart item selection in the backend
    async function updateCartItemSelection(productId, selected) {
        try {
            const response = await fetch(`/cart/update_selection/${productId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ selected: selected })
            });
            if (!response.ok) {
                throw new Error('Failed to update selection');
            }
        } catch (error) {
            console.error('Error updating selection:', error);
        }
    }

    // Function to update cart item quantity in the backend
    async function updateCartItemQuantity(productId, quantity) {
        try {
            const response = await fetch(`/cart/update_quantity/${productId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ quantity: quantity })
            });
            if (!response.ok) {
                throw new Error('Failed to update quantity');
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    }

    // Function to get CSRF token from cookies
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Function to update total based on selected items
    window.updateSelectedItems = function() {
        let total = 0;
        const checkoutBtn = document.getElementById('checkout-btn');
        let anySelected = false;

        document.querySelectorAll('.cart-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const quantityInput = item.querySelector('input[type="number"]');
            const productId = item.dataset.productId;

            if (checkbox) {
                // Update selection in backend
                updateCartItemSelection(productId, checkbox.checked);

                const quantity = parseInt(quantityInput.value) || 1;
                let unitPrice = 0;

                // Get unit price from data attributes
                if (item.dataset.salePrice) {
                    unitPrice = parseFloat(item.dataset.salePrice);
                } else if (item.dataset.unitPrice) {
                    unitPrice = parseFloat(item.dataset.unitPrice);
                }

                if (!isNaN(unitPrice)) {
                    const itemTotal = unitPrice * quantity;

                    // Only add to total if item is checked
                    if (checkbox.checked) {
                        anySelected = true;
                        total += itemTotal;
                    }

                    // Always update the individual item price display
                    const priceElements = item.querySelectorAll('.item-price');
                    priceElements.forEach(element => {
                        element.textContent = `PKR ${itemTotal.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1})}`;
                    });
                }
            }
        });

        // Update the total display with formatting
        if (totalElement) {
            totalElement.textContent = `PKR ${total.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1})}`;
        }

        // Enable/disable checkout button
        if (checkoutBtn) {
            if (anySelected) {
                checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                checkoutBtn.disabled = false;
            } else {
                checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
                checkoutBtn.disabled = true;
            }
        }
    };

    // Add event listeners to all checkboxes
    document.querySelectorAll('.cart-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', window.updateSelectedItems);
    });

    // Add event listeners to quantity inputs
    document.querySelectorAll('.cart-item input[type="number"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const item = e.target.closest('.cart-item');
            const productId = item.dataset.productId;
            const quantity = parseInt(e.target.value) || 1;
            updateCartItemQuantity(productId, quantity);
            window.updateSelectedItems();
        });
    });

    // Add event listeners to quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', () => {
            const item = button.closest('.cart-item');
            const quantityInput = item.querySelector('input[type="number"]');
            const productId = item.dataset.productId;
            const quantity = parseInt(quantityInput.value) || 1;
            updateCartItemQuantity(productId, quantity);
            window.updateSelectedItems();
        });
    });

    // Initialize
    window.updateSelectedItems();
}));