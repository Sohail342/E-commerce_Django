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
                        selected: selected,
                        quantity: parseInt(item.querySelector('input[type="number"]').value)
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        item.classList.toggle('selected', selected);
                        updateSubtotal();
                        
                        // Update cart count if needed
                        const cartCountElement = document.querySelector('.cart-count');
                        if (cartCountElement && data.cart_count) {
                            cartCountElement.textContent = data.cart_count;
                        }
                        
                        // Call the global updateSideCartSubtotal function if it exists
                        if (typeof window.updateSideCartSubtotal === 'function') {
                            window.updateSideCartSubtotal();
                        }
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
        const isAuthenticated = document.body.classList.contains('user-authenticated') || 
                               document.querySelector('body[data-user-authenticated="true"]') !== null;
        
        if (isAuthenticated) {
            // Get the current selection state of the item
            const cartItem = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
            const checkbox = cartItem ? cartItem.querySelector('input[type="checkbox"]') : null;
            const isSelected = checkbox ? checkbox.checked : true;
            
            // Show loading indicator if available
            if (cartItem) {
                cartItem.classList.add('updating');
            }
            
            // For authenticated users, update the quantity in the database
            fetch(`/cart/update_selection/${productId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    quantity: quantity,
                    selected: isSelected  // Preserve the current selection state
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // After successful database update, update the UI
                    updateCartItemUI(productId, quantity, data.total_price);
                    updateSubtotal();
                    
                    // Update cart count if needed
                    const cartCountElement = document.querySelector('.cart-count');
                    if (cartCountElement && data.cart_count) {
                        cartCountElement.textContent = data.cart_count;
                    }
                    
                    // Call the global updateSideCartSubtotal function if it exists
                    if (typeof window.updateSideCartSubtotal === 'function') {
                        window.updateSideCartSubtotal();
                    }
                }
                
                // Remove loading indicator
                if (cartItem) {
                    cartItem.classList.remove('updating');
                }
            })
            .catch(error => {
                console.error('Error updating quantity in database:', error);
                // Remove loading indicator on error
                if (cartItem) {
                    cartItem.classList.remove('updating');
                }
            });
        } else {
            // For guest users, validate the quantity
            validateQuantity(productId, quantity);
        }
    }
    
    // Function to validate quantity with the server
    function validateQuantity(productId, quantity) {
        fetch(`/cart/validate_quantity/${productId}/?quantity=${quantity}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                // Update the UI with the new quantity from server response
                updateCartItemUI(productId, data.quantity);
                
                // Update the subtotal
                updateSubtotal();
                
                // Call the global updateSideCartSubtotal function if it exists
                if (typeof window.updateSideCartSubtotal === 'function') {
                    window.updateSideCartSubtotal();
                }
            }
        })
        .catch(error => console.error('Error validating quantity:', error));
    }
    
    // Function to update cart item UI
    function updateCartItemUI(productId, quantity, totalPrice) {
        const cartItem = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
        if (cartItem) {
            const quantityInput = cartItem.querySelector('.quantity-input');
            // Ensure the input value matches the quantity
            if (quantityInput) {
                quantityInput.value = quantity;
            }
            
            // If totalPrice is not provided, calculate it
            if (!totalPrice) {
                const price = parseFloat(cartItem.dataset.unitPrice);
                const salePrice = parseFloat(cartItem.dataset.salePrice);
                const itemPrice = salePrice || price;
                totalPrice = itemPrice * quantity;
            }
            
            // Update the total price display
            const totalPriceElement = cartItem.querySelector('.total-price');
            if (totalPriceElement) {
                totalPriceElement.textContent = formatPrice(totalPrice);
            }
        }
    }
    
    // Function to fetch cart contents
    function fetchCartContents() {
        return fetch('/cart/ajax_get_cart/', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            // Update the subtotal with the server data
            if (sideCartSubtotal) {
                sideCartSubtotal.textContent = formatPrice(data.subtotal);
            }
            
            // Update cart items with server data for authenticated users
            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    const cartItem = document.querySelector(`.cart-item[data-product-id="${item.id}"]`);
                    if (cartItem) {
                        const quantityInput = cartItem.querySelector('.quantity-input');
                        if (quantityInput && quantityInput.value != item.quantity) {
                            // Update the quantity input with the server's value
                            quantityInput.value = item.quantity;
                            
                            // Update the total price display
                            const totalPriceElement = cartItem.querySelector('.total-price');
                            if (totalPriceElement) {
                                totalPriceElement.textContent = formatPrice(item.total);
                            }
                        }
                    }
                });
            }
            
            return data;
        })
        .catch(error => {
            console.error('Error fetching cart contents:', error);
            return null;
        });
    }

    // Function to calculate and update subtotal
    function updateSubtotal() {
        let subtotal = 0;
        const cartItems = sideCartItems.querySelectorAll('.cart-item');
        const isAuthenticated = document.body.classList.contains('user-authenticated') || 
                               document.querySelector('body[data-user-authenticated="true"]') !== null;

        cartItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const quantityInput = item.querySelector('.quantity-input');
            const price = parseFloat(item.dataset.unitPrice);
            const salePrice = parseFloat(item.dataset.salePrice);
            const quantity = parseInt(quantityInput?.value || 1);
            
            // For authenticated users, only include selected items
            if (isAuthenticated) {
                if (checkbox && checkbox.checked) {
                    subtotal += (salePrice || price) * quantity;
                }
            } else {
                // For guest users, include all items
                subtotal += (salePrice || price) * quantity;
            }
        });

        sideCartSubtotal.textContent = formatPrice(subtotal);
        
        // Call the global updateSideCartSubtotal function if it exists
        if (typeof window.updateSideCartSubtotal === 'function') {
            window.updateSideCartSubtotal();
        }
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