/**
 * Side Cart Subtotal Updater
 * Handles real-time subtotal updates based on quantity changes and item selection
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize global function for updating side cart subtotal
    window.updateSideCartSubtotal = function() {
        const sideCartItems = document.querySelectorAll('#side-cart-items .cart-item');
        const sideCartSubtotal = document.getElementById('side-cart-subtotal');
        const isAuthenticated = document.body.classList.contains('user-authenticated') || 
                               document.querySelector('body[data-user-authenticated="true"]') !== null;
        
        if (!sideCartSubtotal || sideCartItems.length === 0) return;
        
        let subtotal = 0;
        
        sideCartItems.forEach(item => {
            const productId = item.dataset.productId;
            const quantityInput = item.querySelector('.quantity-display');
            const quantity = parseInt(quantityInput?.value || 1);
            
            // Get price from data attribute or from the price element
            let price = 0;
            if (item.dataset.unitPrice) {
                price = parseFloat(item.dataset.unitPrice);
            } else if (item.dataset.salePrice) {
                price = parseFloat(item.dataset.salePrice);
            } else {
                // Try to extract price from the price element
                const priceElement = item.querySelector('.font-medium');
                if (priceElement) {
                    const priceText = priceElement.textContent.trim();
                    // Extract numeric value from "PKR 1,234.56" format
                    const priceMatch = priceText.match(/[\d,]+(\.\d+)?/);
                    if (priceMatch) {
                        price = parseFloat(priceMatch[0].replace(/,/g, ''));
                    }
                }
            }
            
            // For authenticated users, only include selected items
            if (isAuthenticated) {
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) {
                    subtotal += price * quantity;
                }
            } else {
                // For guest users, include all items
                subtotal += price * quantity;
            }
        });
        
        // Format the subtotal with commas
        const formattedSubtotal = new Intl.NumberFormat('en-US').format(subtotal);
        sideCartSubtotal.textContent = `PKR ${formattedSubtotal}`;
    };
    
    // Add event listeners for quantity changes
    const sideCartItems = document.getElementById('side-cart-items');
    if (sideCartItems) {
        // Use event delegation for quantity changes
        sideCartItems.addEventListener('click', function(e) {
            // Check if clicked element is a quantity button
            if (e.target.closest('.quantity-btn')) {
                // Wait for the quantity update to complete
                setTimeout(() => {
                    window.updateSideCartSubtotal();
                }, 100);
            }
        });
        
        // Listen for checkbox changes (for authenticated users)
        sideCartItems.addEventListener('change', function(e) {
            if (e.target.classList.contains('cart-item-select')) {
                window.updateSideCartSubtotal();
            }
        });
    }
    
    // Update subtotal when side cart is opened
    const sideCart = document.getElementById('side-cart');
    if (sideCart) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!sideCart.classList.contains('translate-x-full')) {
                        window.updateSideCartSubtotal();
                    }
                }
            });
        });
        
        observer.observe(sideCart, { attributes: true });
    }
    
    // Initialize subtotal on page load
    window.updateSideCartSubtotal();
});