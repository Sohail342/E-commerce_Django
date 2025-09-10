/**
 * Side Cart Interactions
 * Handles cart interactions and subtotal calculation for the side cart
 */

document.addEventListener('DOMContentLoaded', function() {
    const sideCart = document.getElementById('side-cart');
    const sideCartItems = document.getElementById('side-cart-items');
    const sideCartSubtotal = document.getElementById('side-cart-subtotal');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const itemTemplate = document.getElementById('cart-item-template');
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
    
    // Selection functionality removed

    // Function to format price in PKR
    function formatPrice(price) {
        return `PKR ${parseFloat(price).toFixed(2)}`;
    }

    // Selection functionality removed

    // Function to update quantity for both authenticated and guest users
    function updateQuantity(productId, quantity) {
        const isAuthenticated = document.body.classList.contains('user-authenticated') || 
                               document.querySelector('body[data-user-authenticated="true"]') !== null;
        
        // Get the cart item
        const cartItem = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
        if (!cartItem) return;
        
        // Show loading overlay
        const overlay = createLoadingOverlay(cartItem);
        
        // Get max inventory from data attribute or default to 10
        const maxInventory = parseInt(cartItem.dataset.inventory) || 10;
        
        // Ensure quantity doesn't exceed max inventory
        if (quantity > maxInventory) {
            quantity = maxInventory;
            if (window.showToast) {
                window.showToast(`<div class="flex items-center">
                    <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Maximum available quantity is ${maxInventory}</span>
                </div>`, 'warning');
            }
        }
        
        // Validate quantity with server
        fetch(`/cart/validate_quantity/${productId}/?quantity=${quantity}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            // Ensure loading overlay stays visible for at least 500ms
            const elapsedTime = Date.now() - overlay.startTime;
            const minDisplayTime = 500;
            
            setTimeout(() => {
                if (data.valid) {
                    // Update the UI with the validated quantity
                    updateCartItemUI(productId, data.quantity);
                    
                    // Update the subtotal
                    updateSubtotal();
                    
                    // Call the global updateSideCartSubtotal function if it exists
                    if (typeof window.updateSideCartSubtotal === 'function') {
                        window.updateSideCartSubtotal();
                    }
                    
                    // Add animation to quantity input
                    const quantityInput = cartItem.querySelector('.quantity-input');
                    if (quantityInput) {
                        quantityInput.classList.add('quantity-changed');
                        setTimeout(() => {
                            quantityInput.classList.remove('quantity-changed');
                        }, 600);
                    }
                } else {
                    // Show warning about max quantity
                    if (window.showToast) {
                        window.showToast(`<div class="flex items-center">
                            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>Maximum available quantity is ${data.max_quantity}</span>
                        </div>`, 'warning');
                    }
                    
                    // Update UI with max allowed quantity
                    updateCartItemUI(productId, data.max_quantity);
                    
                    // Update the subtotal
                    updateSubtotal();
                }
                
                // Remove loading overlay
                overlay.remove();
            }, Math.max(0, minDisplayTime - elapsedTime));
        })
        .catch(error => {
            console.error('Error updating quantity:', error);
            
            // Ensure loading overlay stays visible for at least 500ms
            const elapsedTime = Date.now() - overlay.startTime;
            const minDisplayTime = 500;
            
            setTimeout(() => {
                // Remove loading overlay
                overlay.remove();
                
                // Show error message
                if (window.showToast) {
                    window.showToast(`<div class="flex items-center">
                        <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        <span>Error updating quantity</span>
                    </div>`, 'error');
                }
            }, Math.max(0, minDisplayTime - elapsedTime));
        });
    }
    
    // Create loading overlay for cart items with minimum display time
    function createLoadingOverlay(element) {
        const overlay = document.createElement('div');
        overlay.classList.add('loading-overlay');
        overlay.innerHTML = `
            <div class="loading-spinner">
                <svg class="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        `;
        element.style.position = 'relative';
        element.appendChild(overlay);
        
        // Set the start time to track minimum display duration
        overlay.startTime = Date.now();
        return overlay;
    }

    // Add CSS for loading overlay if not already added
    if (!document.querySelector('style[data-id="cart-loading-styles"]')) {
        const style = document.createElement('style');
        style.setAttribute('data-id', 'cart-loading-styles');
        style.textContent = `
            .loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(255, 255, 255, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10;
                border-radius: 0.5rem;
            }
            .loading-spinner {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 2rem;
                width: 2rem;
            }
            .quantity-changed {
                animation: pulse 0.6s ease-in-out;
            }
            @keyframes pulse {
                0% { background-color: transparent; }
                50% { background-color: rgba(79, 70, 229, 0.2); }
                100% { background-color: transparent; }
            }
        `;
        document.head.appendChild(style);
    }

    // Function to update quantity for both authenticated and guest users
    function updateQuantity(productId, quantity) {
        const isAuthenticated = document.body.classList.contains('user-authenticated') || 
                               document.querySelector('body[data-user-authenticated="true"]') !== null;
        
        // Get the cart item
        const cartItem = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
        if (!cartItem) return;
        
        // Show loading overlay
        const overlay = createLoadingOverlay(cartItem);
        
        // Get max inventory from data attribute or default to 10
        const maxInventory = parseInt(cartItem.dataset.inventory) || 10;
        
        // Ensure quantity doesn't exceed max inventory
        if (quantity > maxInventory) {
            quantity = maxInventory;
            if (window.showToast) {
                window.showToast(`<div class="flex items-center">
                    <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Maximum available quantity is ${maxInventory}</span>
                </div>`, 'warning');
            }
        }
        
        // Validate quantity with server
        fetch(`/cart/validate_quantity/${productId}/?quantity=${quantity}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            // Ensure loading overlay stays visible for at least 500ms
            const elapsedTime = Date.now() - overlay.startTime;
            const minDisplayTime = 500;
            
            setTimeout(() => {
                if (data.valid) {
                    // Update the UI with the validated quantity
                    updateCartItemUI(productId, data.quantity);
                    
                    // Update the subtotal
                    updateSubtotal();
                    
                    // Call the global updateSideCartSubtotal function if it exists
                    if (typeof window.updateSideCartSubtotal === 'function') {
                        window.updateSideCartSubtotal();
                    }
                    
                    // Add animation to quantity input
                    const quantityInput = cartItem.querySelector('.quantity-input');
                    if (quantityInput) {
                        quantityInput.classList.add('quantity-changed');
                        setTimeout(() => {
                            quantityInput.classList.remove('quantity-changed');
                        }, 600);
                    }
                } else {
                    // Show warning about max quantity
                    if (window.showToast) {
                        window.showToast(`<div class="flex items-center">
                            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>Maximum available quantity is ${data.max_quantity}</span>
                        </div>`, 'warning');
                    }
                    
                    // Update UI with max allowed quantity
                    updateCartItemUI(productId, data.max_quantity);
                    
                    // Update the subtotal
                    updateSubtotal();
                }
                
                // Remove loading overlay
                overlay.remove();
            }, Math.max(0, minDisplayTime - elapsedTime));
        })
        .catch(error => {
            console.error('Error updating quantity:', error);
            
            // Ensure loading overlay stays visible for at least 500ms
            const elapsedTime = Date.now() - overlay.startTime;
            const minDisplayTime = 500;
            
            setTimeout(() => {
                // Remove loading overlay
                overlay.remove();
                
                // Show error message
                if (window.showToast) {
                    window.showToast(`<div class="flex items-center">
                        <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        <span>Error updating quantity</span>
                    </div>`, 'error');
                }
            }, Math.max(0, minDisplayTime - elapsedTime));
        });
    }
    
    // Function to update cart item UI
    function updateCartItemUI(productId, quantity, totalPrice) {
        const cartItem = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
        if (cartItem) {
            // Update quantity input
            const quantityInput = cartItem.querySelector('.quantity-input');
            if (quantityInput) {
                quantityInput.value = quantity;
            }
            
            // Also update quantity display if it exists (for read-only displays)
            const quantityDisplay = cartItem.querySelector('.quantity-display');
            if (quantityDisplay) {
                quantityDisplay.value = quantity;
            }
            
            // If totalPrice is not provided, calculate it
            if (!totalPrice) {
                const price = parseFloat(cartItem.dataset.unitPrice) || 0;
                const salePrice = parseFloat(cartItem.dataset.salePrice) || 0;
                const itemPrice = salePrice > 0 ? salePrice : price;
                totalPrice = itemPrice * quantity;
            }
            
            // Update all price elements
            // First try .total-price which is in some templates
            const totalPriceElement = cartItem.querySelector('.total-price');
            if (totalPriceElement) {
                totalPriceElement.textContent = formatPrice(totalPrice);
            }
            
            // Also try .product-price which might be in other templates
            const productPriceElement = cartItem.querySelector('.product-price');
            if (productPriceElement) {
                productPriceElement.textContent = formatPrice(totalPrice);
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

    // Function to calculate and update subtotal - modified to include all items for authenticated users
    function updateSubtotal() {
        let subtotal = 0;
        const cartItems = sideCartItems.querySelectorAll('.cart-item');
        const isAuthenticated = document.body.classList.contains('user-authenticated') || 
                               document.querySelector('body[data-user-authenticated="true"]') !== null;

        cartItems.forEach(item => {
            const quantityInput = item.querySelector('.quantity-input');
            const price = parseFloat(item.dataset.unitPrice) || 0;
            const salePrice = parseFloat(item.dataset.salePrice) || 0;
            // Use optional chaining and nullish coalescing to safely access value
            const quantity = parseInt(quantityInput?.value || 1);
            
            // Include all items in subtotal calculation regardless of user type
            subtotal += (salePrice || price) * quantity;
        });

        if (sideCartSubtotal) {
            sideCartSubtotal.textContent = formatPrice(subtotal);
        }
        
        // Call the global updateSideCartSubtotal function if it exists
        if (typeof window.updateSideCartSubtotal === 'function') {
            window.updateSideCartSubtotal();
        }
    }

    // Event delegation for cart item interactions
    // Selection functionality removed

    sideCartItems.addEventListener('click', function(e) {
        const cartItem = e.target.closest('.cart-item');
        if (!cartItem) return;

        const productId = cartItem.dataset.productId;
        const quantityInput = cartItem.querySelector('.quantity-input');
        // Add null check before accessing value property
        if (!quantityInput) return;
        let quantity = parseInt(quantityInput.value);

        if (e.target.classList.contains('quantity-decrease') || e.target.closest('.quantity-decrease')) {
            if (quantity > 1) {
                quantityInput.value = --quantity;
                updateQuantity(productId, quantity);
            }
        } else if (e.target.classList.contains('quantity-increase') || e.target.closest('.quantity-increase')) {
            // Get max inventory from data attribute or default to 10
            const maxInventory = parseInt(cartItem.dataset.inventory) || 10;
            
            // Only increase if not at max inventory
            if (quantity < maxInventory) {
                quantityInput.value = ++quantity;
                updateQuantity(productId, quantity);
            } else {
                // Show warning about max quantity
                if (window.showToast) {
                    window.showToast(`<div class="flex items-center">
                        <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Maximum available quantity is ${maxInventory}</span>
                    </div>`, 'warning');
                }
            }
        } else if (e.target.closest('.remove-item')) {
            window.location.href = `/cart/clear/${productId}/`;
        }
    });
    
    // Add event listeners for quantity input changes
    sideCartItems.addEventListener('change', function(e) {
        if (e.target.classList.contains('quantity-input')) {
            const cartItem = e.target.closest('.cart-item');
            if (!cartItem) return;
            
            const productId = cartItem.dataset.productId;
            let quantity = parseInt(e.target.value);
            
            // Ensure quantity is at least 1
            if (isNaN(quantity) || quantity < 1) {
                quantity = 1;
                e.target.value = quantity;
            }
            
            // Update quantity
            updateQuantity(productId, quantity);
        }
    });
    
    // Add event listeners for quantity input direct typing
    sideCartItems.addEventListener('input', function(e) {
        if (e.target.classList.contains('quantity-input')) {
            // Enforce min value of 1
            if (e.target.value < 1) e.target.value = 1;
            
            // Enforce max value based on inventory
            const cartItem = e.target.closest('.cart-item');
            if (cartItem) {
                const maxInventory = parseInt(cartItem.dataset.inventory) || 10;
                if (parseInt(e.target.value) > maxInventory) {
                    e.target.value = maxInventory;
                }
            }
        }
    });
    
    // Add event listeners for quantity input changes
    sideCartItems.addEventListener('change', function(e) {
        if (e.target.classList.contains('quantity-input')) {
            const cartItem = e.target.closest('.cart-item');
            if (!cartItem) return;
            
            const productId = cartItem.dataset.productId;
            let quantity = parseInt(e.target.value);
            
            // Ensure quantity is at least 1
            if (isNaN(quantity) || quantity < 1) {
                quantity = 1;
                e.target.value = quantity;
            }
            
            // Update quantity
            updateQuantity(productId, quantity);
        }
    });
    
    // Add event listeners for quantity input direct typing
    sideCartItems.addEventListener('input', function(e) {
        if (e.target.classList.contains('quantity-input')) {
            // Enforce min value of 1
            if (e.target.value < 1) e.target.value = 1;
            
            // Enforce max value based on inventory
            const cartItem = e.target.closest('.cart-item');
            if (cartItem) {
                const maxInventory = parseInt(cartItem.dataset.inventory) || 10;
                if (parseInt(e.target.value) > maxInventory) {
                    e.target.value = maxInventory;
                }
            }
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