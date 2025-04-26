/**
 * AJAX Cart Functionality
 * Handles adding products to cart without page refresh and side cart animations
 */

// Immediately hide the side cart before DOM is fully loaded to prevent flash
(function() {
    const sideCart = document.getElementById('side-cart');
    if (sideCart) {
        // Hide the side cart immediately with inline styles
        sideCart.style.display = 'none';
        sideCart.style.transform = 'translateX(100%)';
        sideCart.classList.add('translate-x-full');
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    // Get CSRF token for AJAX requests
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
    
    // Load cart animations CSS if not already loaded
    if (!document.querySelector('link[href*="cart-animations.css"]')) {
        const animationStyles = document.createElement('link');
        animationStyles.rel = 'stylesheet';
        animationStyles.href = '/static/css/cart-animations.css';
        document.head.appendChild(animationStyles);
    }
    
    // Add mobile responsive styles for side cart
    const mobileStyles = document.createElement('style');
    mobileStyles.textContent = `
        @media (max-width: 640px) {
            #side-cart {
                width: 85% !important;
                max-width: 85% !important;
                height: 90% !important;
                max-height: 90vh !important;
                margin: auto 0 !important;
                top: 5% !important;
                bottom: 5% !important;
                border-radius: 12px 0 0 12px !important;
                box-shadow: -5px 0 25px rgba(0, 0, 0, 0.15) !important;
            }
            
            .side-cart-item {
                padding: 0.75rem !important;
            }
            
            /* Smooth side slide animation without vibration effect */
            .animate-cart-slide-in,
            .animate-cart-slide-in-enhanced {
                animation: cartSlideInMobile 0.4s ease-out forwards !important;
                transform: translateX(0) !important; /* Prevent vibration */
            }
            
            .side-cart-exit {
                animation: cartSlideOutMobile 0.3s ease-in forwards !important;
                transform: translateX(100%) !important; /* Prevent vibration */
            }
            
            @keyframes cartSlideInMobile {
                0% { transform: translateX(100%); }
                100% { transform: translateX(0); }
            }
            
            @keyframes cartSlideOutMobile {
                0% { transform: translateX(0); }
                100% { transform: translateX(100%); }
            }
            
            /* Remove any vibration effects */
            #side-cart, .side-cart-item, .cart-item {
                backface-visibility: hidden; /* Prevent flickering */
                -webkit-backface-visibility: hidden;
                -webkit-transform-style: preserve-3d; /* Improve mobile rendering */
                transform-style: preserve-3d;
                will-change: transform; /* Optimize animations */
            }
        }
    `;
    document.head.appendChild(mobileStyles);
    
    // Ensure the side cart is properly hidden after DOM is loaded
    const sideCart = document.getElementById('side-cart');
    if (sideCart) {
        // Make sure the side cart is properly hidden
        if (sideCart.style.display === 'none') {
            // After DOM is loaded, restore display but keep it translated out of view
            sideCart.style.display = '';
            sideCart.classList.add('translate-x-full');
            sideCart.style.transform = 'translateX(100%)';
        }
    }
    
    // Initialize side cart
    initSideCart();
    
    // Add event listener to all add-to-cart buttons
    const addToCartBtn = document.getElementById('add-to-cart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', handleAddToCart);
    }
    
    // Add event listeners to trending products' Add to Cart buttons
    const trendingAddToCartBtns = document.querySelectorAll('.grid a[href*="cart:add_to_cart"], .trending-add-to-cart');
    trendingAddToCartBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Extract product ID from data attribute first, then fallback to href
            let productId = btn.dataset.productId;
            
            // If no data attribute, try to extract from href
            if (!productId) {
                const hrefParts = btn.getAttribute('href').split('/');
                productId = hrefParts[hrefParts.length - 2];
            }
            
            if (productId && !isNaN(parseInt(productId))) {
                // Show loading indicator on the button
                const originalContent = btn.innerHTML;
                btn.innerHTML = '<span class="inline-block animate-spin mr-1">↻</span> Adding...';
                btn.classList.add('opacity-75');
                
                // Add product to cart with quantity 1
                addProductToCart(productId, 1)
                    .then(response => {
                        if (response.success) {
                            // Update cart count
                            updateCartCount();
                            
                            // User is explicitly adding to cart, so clear the explicit close flag
                            sessionStorage.removeItem('cartExplicitlyClosed');
                            
                            // Fetch and update side cart contents
                            fetchCartContents().then(() => {
                                // Open side cart
                                openSideCart();
                                
                                // Remove any existing auto-close timers
                                if (window.sideCartCloseTimer) {
                                    clearTimeout(window.sideCartCloseTimer);
                                    window.sideCartCloseTimer = null;
                                }
                                // Keep the side cart open until user explicitly closes it
                                sessionStorage.setItem('keepCartOpen', 'true');
                                
                                // Reset button state with success indicator
                                btn.innerHTML = '<span class="text-white">✓</span> Added';
                                btn.classList.remove('opacity-75');
                                btn.classList.add('bg-green-600');
                                
                                // Reset button after delay
                                setTimeout(() => {
                                    btn.innerHTML = originalContent;
                                    btn.classList.remove('bg-green-600');
                                }, 2000);
                            });
                        } else {
                            // Show error
                            if (window.showToast) {
                                window.showToast(`<div class="flex items-center">
                                    <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                    <span>Failed to add product to cart</span>
                                </div>`, 'error');
                            }
                            
                            // Reset button
                            btn.innerHTML = originalContent;
                            btn.classList.remove('opacity-75');
                        }
                    })
                    .catch(error => {                        
                        // Show error message
                        if (window.showToast) {
                            window.showToast(`<div class="flex items-center">
                                <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                                <span>Error adding product to cart</span>
                            </div>`, 'error');
                        }
                        
                        // Reset button
                        btn.innerHTML = originalContent;
                        btn.classList.remove('opacity-75');
                    });
            }
        });
    });
    
    // Also add event listeners to the Add to Cart buttons in the home page trending products section
    const homeTrendingAddBtns = document.querySelectorAll('a[href*="cart:add_to_cart"]');
    homeTrendingAddBtns.forEach(btn => {
        if (!btn.classList.contains('grid')) { // Avoid duplicate listeners
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Extract product ID from the href attribute
                const hrefParts = btn.getAttribute('href').split('/');
                const productId = hrefParts[hrefParts.length - 2];
                
                if (productId && !isNaN(parseInt(productId))) {
                    // Show loading indicator
                    const originalContent = btn.innerHTML;
                    btn.innerHTML = '<span class="inline-block animate-spin mr-1">↻</span> Adding...';
                    btn.classList.add('opacity-75');
                    
                    // Add product to cart with quantity 1
                    addProductToCart(productId, 1)
                        .then(response => {
                            if (response.success) {
                                // Update cart count
                                updateCartCount();
                                
                                // User is explicitly adding to cart, so clear the explicit close flag
                                sessionStorage.removeItem('cartExplicitlyClosed');
                                
                                // Fetch and update side cart contents
                                fetchCartContents().then(() => {
                                    // Open side cart
                                    openSideCart();
                                    
                                    // Keep the side cart open until user explicitly closes it
                                    sessionStorage.setItem('keepCartOpen', 'true');
                                    
                                    // Reset button state with success indicator
                                    btn.innerHTML = '<span class="text-white">✓</span> Added';
                                    btn.classList.remove('opacity-75');
                                    btn.classList.add('bg-green-600');
                                    
                                    // Reset button after delay
                                    setTimeout(() => {
                                        btn.innerHTML = originalContent;
                                        btn.classList.remove('bg-green-600');
                                    }, 2000);
                                });
                            } else {
                                // Show error
                                if (window.showToast) {
                                    window.showToast(`<div class="flex items-center">
                                        <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                        <span>Failed to add product to cart</span>
                                    </div>`, 'error');
                                }
                                
                                // Reset button
                                btn.innerHTML = originalContent;
                                btn.classList.remove('opacity-75');
                            }
                        })
                        .catch(error => {
                            // Show error message
                            if (window.showToast) {
                                window.showToast(`<div class="flex items-center">
                                    <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                    <span>Error adding product to cart</span>
                                </div>`, 'error');
                            }
                            
                            // Reset button
                            btn.innerHTML = originalContent;
                            btn.classList.remove('opacity-75');
                        });
                }
            });
        }
    });
    
    // Add event listener to cart icons in the navbar to toggle the side cart
    const cartLinks = document.querySelectorAll('a[href*="cart:cart"]');
    cartLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only prevent default if we're not on a mobile device or if we're on the desktop version
            if (window.innerWidth >= 640) {
                e.preventDefault();
                toggleSideCart();
            }
            // On mobile, let the link navigate to the cart page
        });
    });
    
    // Initialize toast notification function
    window.showToast = function(message, type = 'info') {
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
            }, 5000); // 5 seconds for better readability
        }
    };
});

/**
 * Initialize side cart functionality
 */
function initSideCart() {
    // Add event listeners for side cart controls
    const closeSideCartBtn = document.getElementById('close-side-cart');
    const continueShoppingBtn = document.getElementById('continue-shopping');
    const sideCartOverlay = document.getElementById('side-cart-overlay');
    const sideCart = document.getElementById('side-cart');
    
    // Ensure side cart is initially hidden until a product is added
    if (sideCart) {
        // Make sure the side cart is fully hidden at the start
        sideCart.classList.add('translate-x-full');
        sideCart.style.transform = 'translateX(100%)';
        
        // If the cart was hidden with display:none, restore it but keep it translated out
        if (sideCart.style.display === 'none') {
            sideCart.style.display = '';
        }
        
        // Add transition classes for smooth animation
        sideCart.classList.add('transition-transform', 'duration-300', 'ease-in-out');
        
        // Disable transitions temporarily to prevent flash
        sideCart.style.transition = 'none';
        // Force the browser to recognize the change
        void sideCart.offsetWidth;
        // Re-enable transitions after a short delay
        setTimeout(() => {
            sideCart.style.transition = '';
        }, 50);
        // Add a class to indicate the cart has been properly initialized
        sideCart.classList.add('cart-initialized');
    }
    
    if (sideCartOverlay) {
        // Make sure overlay is hidden initially
        sideCartOverlay.classList.add('hidden');
        sideCartOverlay.classList.add('opacity-0');
        sideCartOverlay.classList.remove('opacity-100');
        // Add transition classes for smooth animation
        sideCartOverlay.classList.add('transition-opacity', 'duration-300', 'ease-in-out');
    }
    
    // Add event listeners for close buttons
    if (closeSideCartBtn) {
        // Remove any existing event listeners by cloning and replacing
        const newCloseBtn = closeSideCartBtn.cloneNode(true);
        closeSideCartBtn.parentNode.replaceChild(newCloseBtn, closeSideCartBtn);
        
        newCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent event bubbling
            // Explicitly remove the keepCartOpen flag when user clicks close
            sessionStorage.removeItem('keepCartOpen');
            closeSideCart();
        });
    }
    
    if (continueShoppingBtn) {
        // Remove any existing event listeners by cloning and replacing
        const newContinueBtn = continueShoppingBtn.cloneNode(true);
        continueShoppingBtn.parentNode.replaceChild(newContinueBtn, continueShoppingBtn);
        
        newContinueBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent event bubbling
            // Explicitly remove the keepCartOpen flag when user clicks continue shopping
            sessionStorage.removeItem('keepCartOpen');
            closeSideCart();
        });
    }
    
    if (sideCartOverlay) {
        // Remove any existing event listeners by cloning and replacing
        const newOverlay = sideCartOverlay.cloneNode(true);
        sideCartOverlay.parentNode.replaceChild(newOverlay, sideCartOverlay);
        
        newOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent event bubbling
            // Explicitly remove the keepCartOpen flag when user clicks overlay
            sessionStorage.removeItem('keepCartOpen');
            closeSideCart();
        });
    }
    
    // Add event listeners to all cart toggle buttons in the header
    const cartToggleButtons = document.querySelectorAll('.cart-toggle');
    cartToggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (window.innerWidth >= 640) { // Only for non-mobile
                e.preventDefault();
                toggleSideCart();
            }
        });
    });
    
    // Initialize cart count on page load
    updateCartCount();
    
}

/**
 * Handle add to cart button click
 * @param {Event} e - Click event
 */
function handleAddToCart(e) {
    e.preventDefault();
    
    // Show loading state
    const addToCartBtn = e.currentTarget;
    addToCartBtn.classList.add('loading');
    document.getElementById('loading-state')?.classList.remove('opacity-0');
    
    // Get product ID from URL or data attribute
    let productId;
    
    // First try to get product ID from data attribute if available
    if (addToCartBtn.dataset && addToCartBtn.dataset.productId) {
        productId = addToCartBtn.dataset.productId;
    } else {
        // Fallback to extracting from URL
        const urlParts = window.location.pathname.split('/');
        // Filter out empty strings and find the ID
        const filteredParts = urlParts.filter(part => part.length > 0);
        // Look for the ID after 'product' or 'product-detail'
        for (let i = 0; i < filteredParts.length - 1; i++) {
            if (filteredParts[i] === 'product' || filteredParts[i] === 'product-detail') {
                productId = filteredParts[i + 1];
                break;
            }
        }
        
        // If still not found, use the second-to-last part as before
        if (!productId && filteredParts.length >= 2) {
            productId = filteredParts[filteredParts.length - 2];
        }
    }
    
    // Validate product ID is a number
    if (!productId || isNaN(parseInt(productId))) {
        
        if (window.showToast) {
            window.showToast(`<div class="flex items-center">
                <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span>Error: Could not determine product ID</span>
            </div>`, 'error');
        }
        
        // Reset loading state
        addToCartBtn.classList.remove('loading');
        document.getElementById('loading-state')?.classList.add('opacity-0');
        return;
    }
    
    // Get quantity
    const quantityInput = document.getElementById('quantity');
    const quantity = quantityInput ? quantityInput.value : 1;
    
    // Send AJAX request to add product to cart
    addProductToCart(productId, quantity)
        .then(response => {
            if (response.success) {
                
                // Update cart count in navbar
                updateCartCount();
                
                // Fetch and update side cart contents
                fetchCartContents().then(() => {
                    // First set the flag to keep cart open before opening it
                    // Make sure to set this flag BEFORE opening the cart
                    sessionStorage.setItem('keepCartOpen', 'true');
                    
                    // Remove any existing auto-close timers
                    if (window.sideCartCloseTimer) {
                        clearTimeout(window.sideCartCloseTimer);
                        window.sideCartCloseTimer = null;
                    }
                    
                    // Open side cart with animation - only when product is successfully added
                    openSideCart();
                    
                    // Reset loading state is now handled in openSideCart function
                    // to ensure it's always reset properly on all devices
                });
                
                // Always reset loading state here as a fallback, regardless of cart opening
                // This ensures the loading state is reset even if there's an issue with the cart
                setTimeout(() => {
                    // Reset loading state
                    addToCartBtn.classList.remove('loading');
                    document.getElementById('loading-state')?.classList.add('opacity-0');
                }, 500);
            } else {
                // Show error message
                if (window.showToast) {
                    window.showToast(`<div class="flex items-center">
                        <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        <span>Failed to add product to cart</span>
                    </div>`, 'error');
                }
                
                // Reset loading state
                addToCartBtn.classList.remove('loading');
                document.getElementById('loading-state')?.classList.add('opacity-0');
            }
        })
        .catch(error => {
            // Show error message
            if (window.showToast) {
                window.showToast(`<div class="flex items-center">
                    <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <span>Error adding product to cart</span>
                </div>`, 'error');
            }
            
            // Reset loading state
            addToCartBtn.classList.remove('loading');
            document.getElementById('loading-state')?.classList.add('opacity-0');
        });
}

/**
 * Add product to cart via AJAX
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to add
 * @returns {Promise} - Promise resolving to response data
 */
function addProductToCart(productId, quantity) {
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
    
    return fetch(`/cart/ajax_add_to_cart/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ quantity: quantity })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
}

/**
 * Fetch cart contents and update side cart
 * @returns {Promise} - Promise resolving when side cart is updated
 */
function fetchCartContents() {
    return fetch('/cart/ajax_get_cart/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        updateSideCart(data);
        return data;
    });
}

/**
 * Update cart count in navbar
 */
function updateCartCount() {
    fetch('/cart/ajax_cart_count/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        // Update cart count in navbar
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
            element.textContent = data.count;
        });
        
        // Update side cart count
        const sideCartCount = document.getElementById('side-cart-count');
        if (sideCartCount) {
            sideCartCount.textContent = data.count;
        }
    });
}

/**
 * Update side cart contents
 * @param {Object} data - Cart data from server
 */
function updateSideCart(data) {
    const sideCartItems = document.getElementById('side-cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const sideCartSubtotal = document.getElementById('side-cart-subtotal');
    
    if (!sideCartItems) return;
    
    // Clear current items (except empty message)
    const currentItems = sideCartItems.querySelectorAll('.side-cart-item');
    currentItems.forEach(item => item.remove());
    
    // Show/hide empty cart message
    if (data.items.length === 0) {
        if (emptyCartMessage) emptyCartMessage.classList.remove('hidden');
        if (sideCartSubtotal) sideCartSubtotal.textContent = 'PKR 0.00';
        return;
    } else {
        if (emptyCartMessage) emptyCartMessage.classList.add('hidden');
    }
    
    // Add items to side cart
    data.items.forEach(item => {
        const itemElement = createCartItemElement(item);
        // Insert before empty cart message
        if (emptyCartMessage) {
            sideCartItems.insertBefore(itemElement, emptyCartMessage);
        } else {
            sideCartItems.appendChild(itemElement);
        }
    });
    
    // Update subtotal
    if (sideCartSubtotal) {
        sideCartSubtotal.textContent = `PKR ${data.subtotal}`;
        
        // Call the global updateSelectedItems function to ensure UI is updated
        if (typeof window.updateSelectedItems === 'function') {
            window.updateSelectedItems();
        }
        
        // Call the global updateSideCartSubtotal function if it exists
        if (typeof window.updateSideCartSubtotal === 'function') {
            window.updateSideCartSubtotal();
        }
    }
}

/**
 * Create cart item element
 * @param {Object} item - Cart item data
 * @returns {HTMLElement} - Cart item element
 */
function createCartItemElement(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'side-cart-item flex flex-col py-4 border-b border-gray-200 animate-fadeIn highlight-item cart-item-hover transition-all duration-300';
    itemElement.dataset.productId = item.id;
    itemElement.dataset.unitPrice = item.price;
    if (item.sale_price) {
        itemElement.dataset.salePrice = item.sale_price;
    }
    itemElement.classList.add('cart-item');
    
    // Check if user is authenticated
    const isAuthenticated = document.body.classList.contains('user-authenticated') || 
                           document.querySelector('body[data-user-authenticated="true"]') !== null;
    
    // Format price with commas
    const formattedPrice = new Intl.NumberFormat('en-US').format(item.price);
    const totalPrice = new Intl.NumberFormat('en-US').format(item.price * item.quantity);
    
    itemElement.innerHTML = `
        <div class="flex items-center space-x-3">
            ${isAuthenticated ? `
            <div class="flex-shrink-0 rounded mt-1 flex items-center justify-center">
                <label class="custom-checkbox">
                    <input type="checkbox" class="cart-item-select rounded border-2 border-gray-300 transition-colors duration-200"
                           data-selected="true"
                           checked
                           @change="updateSelectedItems()">
                    <div class="checkbox-indicator">
                        <svg class="checkbox-checkmark" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path>
                        </svg>
                    </div>
                </label>
            </div>
            ` : ''}
            <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 group">
                <img src="${item.image}" alt="${item.name}" class="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110">
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-gray-900 truncate">${item.name}</h3>
                <p class="mt-1 text-sm text-gray-500">
                    <span class="font-medium">PKR ${formattedPrice}</span>
                </p>
                <p class="mt-1 text-sm font-bold text-primary-700 total-price">
                    PKR ${totalPrice}
                </p>
            </div>
            <div class="flex-shrink-0">
                <button class="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 remove-item transform hover:scale-110 active:scale-95" data-product-id="${item.id}">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
        <div class="mt-3 flex items-center justify-between">
            <div class="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button class="quantity-btn px-2 py-1 bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-700 transition-colors duration-200 focus:outline-none" data-action="decrease" data-product-id="${item.id}">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                    </svg>
                </button>
                <input type="number" class="quantity-display px-3 py-1 text-center text-sm font-medium min-w-[2rem] border-0 focus:ring-0" value="${item.quantity}" min="1" max="${item.inventory}" readonly>
                <button class="quantity-btn px-2 py-1 bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-700 transition-colors duration-200 focus:outline-none" data-action="increase" data-product-id="${item.id}">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                </button>
            </div>
            <a href="/shop/product/${item.id}" class="text-xs text-primary-600 hover:text-primary-800 hover:underline transition-colors duration-200">
                View Details
            </a>
        </div>
    `;
    
    // Add event listener to remove button
    const removeButton = itemElement.querySelector('.remove-item');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            // Add removal animation
            itemElement.classList.add('item-removing');
            // Wait for animation to complete before removing
            setTimeout(() => {
                removeCartItem(item.id);
            }, 300);
        });
    }
    
    // Add event listeners for quantity adjustment buttons
    const decreaseBtn = itemElement.querySelector('[data-action="decrease"]');
    const increaseBtn = itemElement.querySelector('[data-action="increase"]');
    const quantityDisplay = itemElement.querySelector('.quantity-display');
    
    if (decreaseBtn && quantityDisplay) {
        decreaseBtn.addEventListener('click', function() {
            const currentQty = parseInt(quantityDisplay.value);
            if (currentQty > 1) {
                // Add animation class
                quantityDisplay.classList.add('quantity-changed');
                setTimeout(() => {
                    quantityDisplay.classList.remove('quantity-changed');
                }, 600);
                
                // Update quantity
                updateCartItemQuantity(item.id, currentQty - 1);
            }
        });
    }
    
    if (increaseBtn && quantityDisplay) {
        increaseBtn.addEventListener('click', function() {
            const currentQty = parseInt(quantityDisplay.value);
            const maxInventory = parseInt(quantityDisplay.getAttribute('max')) || item.inventory;
            
            // Check if current quantity is already at max inventory
            if (currentQty >= maxInventory) {
                // Show toast message if available
                if (window.showToast) {
                    window.showToast(`<div class="flex items-center">
                        <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Maximum available quantity is ${maxInventory}</span>
                    </div>`, 'warning');
                }
                return;
            }
            
            // Add animation class
            quantityDisplay.classList.add('quantity-changed');
            setTimeout(() => {
                quantityDisplay.classList.remove('quantity-changed');
            }, 600);
            
            // Update quantity
            updateCartItemQuantity(item.id, currentQty + 1);
        });
    }
    
    return itemElement;
}

/**
 * Remove item from cart
 * @param {string} productId - Product ID to remove
 */
function removeCartItem(productId) {
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
    
    fetch(`/cart/ajax_remove_from_cart/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update cart count
            updateCartCount();
            // Refresh side cart contents
            fetchCartContents();
        }
    });
}

/**
 * Toggle side cart visibility
 */
function toggleSideCart() {
    const sideCart = document.getElementById('side-cart');
    const isMobile = window.innerWidth < 640;
    
    // Check if side cart is already open - if so, close it
    if (sideCart) {
        const isOpen = !sideCart.classList.contains('translate-x-full') || 
                      sideCart.style.transform === '' || 
                      sideCart.style.transform === 'translateX(0)' || 
                      sideCart.style.transform === 'translateX(0px)';
        
        if (isOpen) {
            closeSideCart();
        } else {
            // User is explicitly toggling the cart open, so clear the explicit close flag
            sessionStorage.removeItem('cartExplicitlyClosed');
            openSideCart();
        }
        
        // Add haptic feedback for mobile devices if supported
        if (isMobile && 'vibrate' in navigator) {
            navigator.vibrate(30); // Subtle vibration
        }
    }
}

/**
 * Open side cart with enhanced animations
 */
function openSideCart() {
    const sideCart = document.getElementById('side-cart');
    const overlay = document.getElementById('side-cart-overlay');
    const checkoutButton = document.querySelector('a[href*="checkout"]');
    const isMobile = window.innerWidth < 640;
    
    // Save current scroll position for mobile view
    if (isMobile) {
        sessionStorage.setItem('scrollPosition', window.pageYOffset);
    }
    
    // Clear any existing auto-close timer that might be set elsewhere
    if (window.sideCartCloseTimer) {
        clearTimeout(window.sideCartCloseTimer);
        window.sideCartCloseTimer = null;
    }
    
    // Always clear the cartExplicitlyClosed flag when intentionally opening the cart
    // This ensures the cart can be reopened when needed
    sessionStorage.removeItem('cartExplicitlyClosed');
    sessionStorage.setItem('keepCartOpen', 'true');
    
    if (sideCart && overlay) {
        // Make sure the cart is visible and not hidden with display:none
        if (sideCart.style.display === 'none') {
            sideCart.style.display = '';
        }
        
        // Store the timestamp when cart was opened to prevent side-cart-init.js from closing it
        sessionStorage.setItem('lastCartOpen', new Date().getTime());
        
        // Show overlay with animation
        overlay.classList.remove('hidden');
        // Force browser to recognize the change before adding the opacity
        void overlay.offsetWidth;
        setTimeout(() => {
            overlay.classList.add('opacity-100');
            overlay.classList.remove('opacity-0');
        }, 10);
        
        // Reset any existing animation classes to ensure clean animation
        sideCart.classList.remove('animate-cart-slide-in', 'animate-cart-slide-in-enhanced', 'side-cart-exit', 'mobile-slide-up', 'mobile-slide-down');
        
        // Reset any inline transform styles that might be interfering
        sideCart.style.transform = '';
        sideCart.style.removeProperty('transform');
        
        // Force browser to recognize the changes before adding new classes
        void sideCart.offsetWidth;
        
        // Ensure the cart is visible with display flex (matches the HTML structure)
        sideCart.style.display = 'flex';
        
        // Slide in cart with enhanced animation
        sideCart.classList.remove('translate-x-full');
        
        // Add class to prevent auto-hiding and ensure it stays open
        sideCart.classList.add('prevent-auto-hide');
        
        // Let the CSS animation handle the transform
        // Don't set inline transform style as it can override the animation
        
        // Add different animations based on device type
        if (isMobile) {
            // Add mobile-specific classes if needed
            sideCart.classList.add('animate-cart-slide-in-enhanced', 'mobile-touch-feedback', 'mobile-slide-up');
            // Add haptic feedback for mobile devices if supported
            if ('vibrate' in navigator) {
                navigator.vibrate(50); // Subtle vibration
            }
        } else {
            // Desktop animation
            sideCart.classList.add('animate-cart-slide-in-enhanced');
        }
            
        // Highlight checkout button with animation
        if (checkoutButton) {
            checkoutButton.classList.add('bg-green-600', 'hover:bg-green-700', 'transition-all', 'duration-300', 'btn-micro-interaction', 'checkout-button-enhanced');
            checkoutButton.classList.remove('bg-white', 'hover:bg-gray-50', 'text-gray-700');
            checkoutButton.classList.add('text-white');
        }
        
        // Add body class to prevent scrolling only for the cart area, not the whole page on mobile
        if (isMobile) {
            // For mobile, we don't want to prevent scrolling of the whole page
            document.body.classList.add('cart-open');
            // Only add overflow-hidden to desktop view
            document.body.classList.add('sm:overflow-auto');
        } else {
            // For desktop, we can prevent scrolling as the cart is a sidebar
            document.body.classList.add('overflow-hidden', 'sm:overflow-auto', 'cart-open');
        }
        
        // Add safe area padding for mobile devices with notches
        if (isMobile) {
            sideCart.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
        }
        
        // Animate the cart count badge
        const sideCartCount = document.getElementById('side-cart-count');
        if (sideCartCount) {
            sideCartCount.classList.add('cart-count-update');
            setTimeout(() => {
                sideCartCount.classList.remove('cart-count-update');
            }, 500);
        }
        
        // Reset loading states after cart is opened - with improved mobile handling
        setTimeout(() => {
            // Reset any loading states with more comprehensive selectors
            const loadingStates = document.querySelectorAll('.loading-state, #loading-state, [id*="loading"], [class*="loading-"]');
            loadingStates.forEach(el => {
                if (el) {
                    el.classList.add('opacity-0');
                    // For mobile devices, ensure the loading state is fully hidden
                    if (isMobile) {
                        el.style.display = 'none';
                        // Reset display after animation completes
                        setTimeout(() => {
                            el.style.display = '';
                        }, 500);
                    }
                }
            });
            
            // Reset any loading buttons with more comprehensive selectors
            const loadingButtons = document.querySelectorAll('.loading, [class*="loading"], button.opacity-75');
            loadingButtons.forEach(btn => {
                if (btn) {
                    btn.classList.remove('loading', 'opacity-75');
                }
            });
            
            // Specifically target the loading overlay on product detail page
            const addToCartBtn = document.getElementById('add-to-cart');
            if (addToCartBtn) {
                addToCartBtn.classList.remove('loading');
            }
            
            // Ensure the loading state is reset on mobile navbar button
            if (isMobile) {
                document.querySelectorAll('button[class*="add-to-cart"], a[class*="add-to-cart"]').forEach(btn => {
                    btn.classList.remove('loading', 'opacity-75');
                });
            }
        }, 500); // Increased delay to ensure cart is fully opened before resetting loading states
    }
}

/**
 * Close side cart with enhanced animations
 */
function closeSideCart() {
    const sideCart = document.getElementById('side-cart');
    const overlay = document.getElementById('side-cart-overlay');
    const checkoutButton = document.querySelector('a[href*="checkout"]');
    const isMobile = window.innerWidth < 640;
    
    // Check if this was triggered by a user action
    const isUserAction = document.activeElement && 
        (document.activeElement.id === 'close-side-cart' || 
         document.activeElement.id === 'continue-shopping' ||
         document.activeElement.id === 'side-cart-overlay');
    
    // If this is a user action, remove the keepCartOpen flag and set a flag indicating explicit close
    if (isUserAction) {
        sessionStorage.removeItem('keepCartOpen');
        // Set a flag to indicate the cart was explicitly closed by the user
        // This will prevent automatic reopening
        sessionStorage.setItem('cartExplicitlyClosed', 'true');
    }
    
    // Only check keepCartOpen flag if this is NOT a user action
    // This ensures user-initiated close actions always work
    if (!isUserAction && sessionStorage.getItem('keepCartOpen') === 'true') {
        return; // Don't close the cart if keepCartOpen is true and not a user action
    }
    
    if (sideCart && overlay) {
        // Add closing animation class
        if (isMobile) {
            sideCart.classList.add('side-cart-exit', 'mobile-slide-down');
        } else {
            sideCart.classList.add('side-cart-exit');
        }
        
        // Hide overlay with enhanced animation
        overlay.classList.remove('opacity-100');
        overlay.classList.add('opacity-0', 'overlay-exit');
        overlay.classList.add('hidden'); // Ensure overlay is hidden
        
        // Add haptic feedback for mobile devices if supported
        if (isMobile && 'vibrate' in navigator) {
            navigator.vibrate(30); // Subtle vibration
        }
        
        // Reset checkout button styling with animation
        if (checkoutButton) {
            checkoutButton.classList.remove('bg-green-900', 'hover:bg-green-700', 'btn-micro-interaction', 'checkout-button-enhanced');
            checkoutButton.classList.add('bg-white', 'hover:bg-gray-50', 'text-gray-700', 'transition-all', 'duration-300');
            checkoutButton.classList.remove('text-white');
        }
        
        // Remove body class to allow scrolling - fix for mobile scrolling issue
        document.body.classList.remove('overflow-hidden');
        document.body.classList.remove('cart-open');
        
        // Restore scroll position for mobile view
        if (isMobile) {
            const savedScrollPosition = sessionStorage.getItem('scrollPosition');
            if (savedScrollPosition) {
                setTimeout(() => {
                    window.scrollTo(0, parseInt(savedScrollPosition));
                }, 50); // Small delay to ensure DOM updates complete
            }
        }
        
        // Reset any active animations
        const cartItems = document.querySelectorAll('.side-cart-item');
        cartItems.forEach(item => {
            item.classList.remove('highlight-item', 'animate-fadeIn');
        });
        
        // Clear the lastCartOpen timestamp to allow side-cart-init.js to work normally next time
        sessionStorage.removeItem('lastCartOpen');
        
        // Reset any loading states that might be active - with improved mobile handling
        const loadingStates = document.querySelectorAll('.loading-state, #loading-state, [id*="loading"], [class*="loading-"]');
        loadingStates.forEach(el => {
            if (el) {
                el.classList.add('opacity-0');
                // For mobile devices, ensure the loading state is fully hidden
                if (isMobile) {
                    el.style.display = 'none';
                    // Reset display after animation completes
                    setTimeout(() => {
                        el.style.display = '';
                    }, 300);
                }
            }
        });
        
        // Reset any loading buttons with more comprehensive selectors
        const loadingButtons = document.querySelectorAll('.loading, [class*="loading"], button.opacity-75');
        loadingButtons.forEach(btn => {
            if (btn) {
                btn.classList.remove('loading', 'opacity-75');
            }
        });
        
        // Specifically target the loading overlay on product detail page
        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.classList.remove('loading');
        }
        
        // Ensure the loading state is reset on mobile navbar button
        if (isMobile) {
            document.querySelectorAll('button[class*="add-to-cart"], a[class*="add-to-cart"]').forEach(btn => {
                btn.classList.remove('loading', 'opacity-75');
            });
        }
        loadingButtons.forEach(btn => {
            if (btn) btn.classList.remove('loading');
        });
        
        // Add a small delay to ensure animations complete before removing event listeners
        setTimeout(() => {
            // Remove any lingering event listeners by cloning and replacing the overlay
            if (overlay.parentNode) {
                const newOverlay = overlay.cloneNode(true);
                overlay.parentNode.replaceChild(newOverlay, overlay);
            }
        }, 300); // Match the duration of the side-cart-exit animation
    }
}

/**
 * Update cart item quantity
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity
 */
function updateCartItemQuantity(productId, quantity) {
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
    
    // Show loading state in main cart
    const quantityContainer = document.querySelector(`.cart-item[data-product-id="${productId}"] .quantity-controls`);
    const quantityDisplay = document.querySelector(`.cart-item[data-product-id="${productId}"] .quantity-display`);
    
    // Show loading state in side cart
    const sideCartQuantityControls = document.querySelector(`.side-cart-item[data-product-id="${productId}"] .flex.items-center.border`);
    const sideCartQuantityDisplay = document.querySelector(`.side-cart-item[data-product-id="${productId}"] .quantity-display`);
    
    // Add loading UI to main cart
    if (quantityContainer) {
        // Add loading indicator and disable controls
        quantityContainer.classList.add('opacity-50');
        const loadingSpinner = document.createElement('span');
        loadingSpinner.className = 'absolute inset-0 flex items-center justify-center';
        loadingSpinner.innerHTML = '<svg class="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
        quantityContainer.appendChild(loadingSpinner);
        
        // Disable quantity controls during update
        const controls = quantityContainer.querySelectorAll('button');
        controls.forEach(control => control.disabled = true);
    }
    
    // Add loading UI to side cart
    if (sideCartQuantityControls) {
        // Add loading indicator and disable controls
        sideCartQuantityControls.classList.add('opacity-50', 'relative');
        const sideCartLoadingSpinner = document.createElement('span');
        sideCartLoadingSpinner.className = 'absolute inset-0 flex items-center justify-center bg-white/50';
        sideCartLoadingSpinner.innerHTML = '<svg class="animate-spin h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
        sideCartQuantityControls.appendChild(sideCartLoadingSpinner);
        
        // Disable quantity controls during update
        const sideCartControls = sideCartQuantityControls.querySelectorAll('button');
        sideCartControls.forEach(control => control.disabled = true);
    }
    
    fetch(`/cart/update_selection/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ quantity: quantity })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update cart count
            updateCartCount();
            
            // Remove loading state from main cart
            if (quantityContainer) {
                quantityContainer.classList.remove('opacity-50');
                const loadingSpinner = quantityContainer.querySelector('.absolute');
                if (loadingSpinner) {
                    loadingSpinner.remove();
                }
                
                // Re-enable quantity controls
                const controls = quantityContainer.querySelectorAll('button');
                controls.forEach(control => control.disabled = false);
            }
            
            // Remove loading state from side cart
            const sideCartQuantityControls = document.querySelector(`.side-cart-item[data-product-id="${productId}"] .flex.items-center.border`);
            if (sideCartQuantityControls) {
                sideCartQuantityControls.classList.remove('opacity-50', 'relative');
                const sideCartLoadingSpinner = sideCartQuantityControls.querySelector('.absolute');
                if (sideCartLoadingSpinner) {
                    sideCartLoadingSpinner.remove();
                }
                
                // Re-enable quantity controls
                const sideCartControls = sideCartQuantityControls.querySelectorAll('button');
                sideCartControls.forEach(control => control.disabled = false);
            }
            
            // Update item quantity display
            const quantityDisplay = document.querySelector(`.cart-item[data-product-id="${productId}"] .quantity-display`);
            if (quantityDisplay) {
                if (quantityDisplay.tagName === 'INPUT') {
                    quantityDisplay.value = quantity;
                } else {
                    quantityDisplay.textContent = quantity;
                }
            }
            
            // Update total price
            const totalPriceElement = document.querySelector(`.cart-item[data-product-id="${productId}"] .total-price`);
            if (totalPriceElement && data.total_price) {
                totalPriceElement.textContent = `PKR ${new Intl.NumberFormat('en-US').format(data.total_price)}`;
            }
            
            // Update cart subtotal if available
            if (data.cart_total) {
                const subtotalElement = document.getElementById('cart-subtotal');
                if (subtotalElement) {
                    subtotalElement.textContent = `PKR ${new Intl.NumberFormat('en-US').format(data.cart_total)}`;
                }
                
                // Update side cart subtotal
                const sideCartSubtotal = document.getElementById('side-cart-subtotal');
                if (sideCartSubtotal) {
                    sideCartSubtotal.textContent = `PKR ${new Intl.NumberFormat('en-US').format(data.cart_total)}`;
                }
                
                // Call the global updateSideCartSubtotal function if it exists
                if (typeof window.updateSideCartSubtotal === 'function') {
                    window.updateSideCartSubtotal();
                }
            }
            
            // Fetch updated cart data to update the side cart subtotal
            fetchCartContents()
                .then(cartData => {
                    // Update side cart subtotal
                    const sideCartSubtotal = document.getElementById('side-cart-subtotal');
                    if (sideCartSubtotal && cartData && cartData.subtotal !== undefined) {
                        sideCartSubtotal.textContent = `PKR ${new Intl.NumberFormat('en-US').format(cartData.subtotal)}`;
                    }
                    
                    // Call the global updateSideCartSubtotal function if it exists
                    if (typeof window.updateSideCartSubtotal === 'function') {
                        window.updateSideCartSubtotal();
                    }
                    
                    // If side-cart-interactions.js has an updateSubtotal function in the global scope, call it
                    if (typeof window.updateSelectedItems === 'function') {
                        window.updateSelectedItems();
                    }
                });
        } else {
            // Show error message
            if (window.showToast) {
                window.showToast(`<div class="flex items-center">
                    <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <span>Failed to update quantity</span>
                </div>`, 'error');
            }
        }
    })
    .catch(error => {
        // Remove loading state from main cart
        if (quantityContainer) {
            quantityContainer.classList.remove('opacity-50');
            const loadingSpinner = quantityContainer.querySelector('.absolute');
            if (loadingSpinner) {
                loadingSpinner.remove();
            }
            
            // Re-enable quantity controls
            const controls = quantityContainer.querySelectorAll('button');
            controls.forEach(control => control.disabled = false);
        }
        
        // Remove loading state from side cart
        const sideCartQuantityControls = document.querySelector(`.side-cart-item[data-product-id="${productId}"] .flex.items-center.border`);
        if (sideCartQuantityControls) {
            sideCartQuantityControls.classList.remove('opacity-50', 'relative');
            const sideCartLoadingSpinner = sideCartQuantityControls.querySelector('.absolute');
            if (sideCartLoadingSpinner) {
                sideCartLoadingSpinner.remove();
            }
            
            // Re-enable quantity controls
            const sideCartControls = sideCartQuantityControls.querySelectorAll('button');
            sideCartControls.forEach(control => control.disabled = false);
        }
        
        // Show error message
        if (window.showToast) {
            window.showToast(`<div class="flex items-center">
                <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span>Error updating quantity</span>
            </div>`, 'error');
        }
    });
}