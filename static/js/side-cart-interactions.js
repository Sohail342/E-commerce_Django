/**
 * Side Cart Interactions
 * Handles item selection and subtotal calculation for the side cart
 */

document.addEventListener('DOMContentLoaded', function() {
    const sideCart = document.getElementById('side-cart');
    const sideCartItems = document.getElementById('side-cart-items');
    const sideCartSubtotal = document.getElementById('side-cart-subtotal');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const itemTemplate = document.getElementById('cart-item-template');
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
    
    // Make updateSelectedItems function available globally
    window.updateSelectedItems = function() {
        const cartItems = sideCartItems.querySelectorAll('.cart-item');
        cartItems.forEach(item => {
            const productId = item.dataset.productId;
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
                const selected = checkbox.checked;
                
                fetch(`/cart/update_selection/${productId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify({
                        selected: selected
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        item.classList.toggle('selected', selected);
                        updateSubtotal();
                    }
                })
                .catch(error => console.error('Error:', error));
            }
        });
    };

    // Function to format price in PKR
    function formatPrice(price) {
        return `PKR ${parseFloat(price).toFixed(2)}`;
    }

    // Function to update cart item selection
    function updateItemSelection(productId, selected) {
        fetch(`/cart/update_selection/${productId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                selected: selected
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateSubtotal();
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // Function to update quantity
    function updateQuantity(productId, quantity) {
        fetch(`/cart/validate_quantity/${productId}/?quantity=${quantity}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                updateSubtotal();
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // Function to calculate and update subtotal
    function updateSubtotal() {
        let subtotal = 0;
        const cartItems = sideCartItems.querySelectorAll('.cart-item');

        cartItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const quantityInput = item.querySelector('.quantity-input');
            const price = parseFloat(item.dataset.unitPrice);
            const salePrice = parseFloat(item.dataset.salePrice);

            if (checkbox && checkbox.checked) {
                const quantity = parseInt(quantityInput.value);
                subtotal += (salePrice || price) * quantity;
            }
        });

        sideCartSubtotal.textContent = formatPrice(subtotal);
    }

    // Event delegation for cart item interactions
    sideCartItems.addEventListener('change', function(e) {
        if (e.target.classList.contains('cart-item-select')) {
            const cartItem = e.target.closest('.cart-item');
            const productId = cartItem.dataset.productId;
            updateItemSelection(productId, e.target.checked);
        }
    });

    sideCartItems.addEventListener('click', function(e) {
        const cartItem = e.target.closest('.cart-item');
        if (!cartItem) return;

        const productId = cartItem.dataset.productId;
        const quantityInput = cartItem.querySelector('.quantity-input');
        let quantity = parseInt(quantityInput.value);

        if (e.target.classList.contains('quantity-decrease')) {
            if (quantity > 1) {
                quantityInput.value = --quantity;
                updateQuantity(productId, quantity);
            }
        } else if (e.target.classList.contains('quantity-increase')) {
            quantityInput.value = ++quantity;
            updateQuantity(productId, quantity);
        } else if (e.target.closest('.remove-item')) {
            window.location.href = `/cart/clear/${productId}/`;
        }
    });

    // Update subtotal when the side cart is opened
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (!sideCart.classList.contains('translate-x-full')) {
                    updateSubtotal();
                }
            }
        });
    });

    observer.observe(sideCart, { attributes: true });
});