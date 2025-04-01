document.addEventListener('DOMContentLoaded', function() {
    const quantityInputs = document.querySelectorAll('input[type="number"]');

    // Debounce function to limit how often a function is called
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Helper function to parse price text that may contain commas
    function parsePrice(priceText) {
        return parseFloat(priceText.replace('PKR ', '').replace(/,/g, ''));
    }

    // Format price consistently
    function formatPrice(price) {
        return `PKR ${price.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1})}`;
    }

    // Format all prices on page load
    function formatInitialPrices() {
        document.querySelectorAll('.item-price').forEach(element => {
            const price = parsePrice(element.textContent);
            if (!isNaN(price)) {
                element.textContent = formatPrice(price);
            }
        });
        
        // Also format the cart total
        const totalElement = document.querySelector('.cart-total');
        if (totalElement) {
            const total = parsePrice(totalElement.textContent);
            if (!isNaN(total)) {
                totalElement.textContent = formatPrice(total);
            }
        }
    }
    
    // Check if this is a guest user
    const isGuestUser = document.getElementById('checkout-guest-btn') !== null;
    
    // Initialize cart total and checkout button state
    formatInitialPrices();
    updateCartTotal();
    
    // For guest users, we need to initialize the cart total and enable the checkout button if there are items
    if (isGuestUser) {
        const guestCheckoutBtn = document.getElementById('checkout-guest-btn');
        if (guestCheckoutBtn) {
            // Set the initial state of the Alpine.js binding
            if (guestCheckoutBtn._x_dataStack && guestCheckoutBtn._x_dataStack[0]) {
                guestCheckoutBtn._x_dataStack[0].disabled = false;
            }
        }
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

// Add CSS for loading overlay
const style = document.createElement('style');
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
`;
document.head.appendChild(style);

function updateItemPrice(quantityInput) {
        const itemContainer = quantityInput.closest('.cart-item');
        const priceElements = itemContainer.querySelectorAll('.item-price');

        let unitPrice = 0;
        let priceToUse = 0;
        
        // Show loading overlay
        const overlay = createLoadingOverlay(itemContainer);
        
        // Check if product is on sale first
        const isOnSale = itemContainer.querySelector('.text-green-600') !== null;
        
        // Get unit price from data attribute first - prioritize sale price if on sale
        if (isOnSale && itemContainer.dataset.salePrice) {
            unitPrice = parseFloat(itemContainer.dataset.salePrice);
            priceToUse = unitPrice; // Set priceToUse to sale price immediately
        } else if (itemContainer.dataset.unitPrice) {
            unitPrice = parseFloat(itemContainer.dataset.unitPrice);
            priceToUse = unitPrice;
        }
        
        // Fallback to DOM elements if data attributes are not available
        if (unitPrice === 0) {
            if (isOnSale) {
                const salePriceElement = itemContainer.querySelector('.text-primary-600');
                if (salePriceElement) {
                    unitPrice = parsePrice(salePriceElement.textContent);
                    priceToUse = unitPrice; // Set priceToUse to sale price immediately
                }
            } else {
                const regularPriceElement = itemContainer.querySelector('.text-gray-500');
                if (regularPriceElement) {
                    unitPrice = parsePrice(regularPriceElement.textContent);
                    priceToUse = unitPrice;
                }
            }
        }
        
        const quantity = parseInt(quantityInput.value) || 1;
        if (isNaN(unitPrice) || unitPrice <= 0) {
            console.error('Invalid price:', { unitPrice });
            overlay.remove();
            return;
        }
        
        const productId = itemContainer.dataset.productId;

        if (isNaN(quantity) || quantity < 1) {
            quantityInput.value = 1;
            overlay.remove();
            return;
        }
        
        // Check if quantity exceeds max inventory and update increase button state
        const maxInventory = parseInt(quantityInput.getAttribute('max')) || 1;
        const increaseBtn = itemContainer.querySelector('.quantity-btn.increase');
        if (quantity >= maxInventory && increaseBtn) {
            increaseBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else if (increaseBtn) {
            increaseBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }

        fetch(`/cart/validate_quantity/${productId}/?quantity=${quantity}`)
            .then(response => response.json())
            .then(data => {
                if (data.valid) {
                    // Always use the priceToUse that was determined earlier
                    const totalPrice = priceToUse * quantity;
                    console.log(`Unit Price: ${unitPrice}`);
                    console.log(`Quantity: ${quantity}`);
                    console.log(`Total Price: ${totalPrice}`);
                    // Update ALL price elements
                    priceElements.forEach(element => {
                        element.textContent = formatPrice(totalPrice);
                    });
                } else {
                    createToast(`Maximum available quantity is ${data.max_quantity}`, 'warning');
                    quantityInput.value = data.max_quantity;
                    // Always use the priceToUse that was determined earlier
                    const totalPrice = priceToUse * data.max_quantity;
                    // Update ALL price elements
                    priceElements.forEach(element => {
                        element.textContent = formatPrice(totalPrice);
                    });
                }
                updateCartTotal();
                
                // Ensure loading overlay stays visible for at least 2-3 seconds
                const elapsedTime = Date.now() - overlay.startTime;
                const minDisplayTime = 500; // 0.5 seconds minimum display time
                
                if (elapsedTime < minDisplayTime) {
                    setTimeout(() => {
                        overlay.remove();
                    }, minDisplayTime - elapsedTime);
                } else {
                    overlay.remove();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                // Ensure loading overlay stays visible for at least 2 seconds even on error
                const elapsedTime = Date.now() - overlay.startTime;
                const minDisplayTime = 2000;
                
                if (elapsedTime < minDisplayTime) {
                    setTimeout(() => {
                        overlay.remove();
                    }, minDisplayTime - elapsedTime);
                } else {
                    overlay.remove();
                }
            });
    }

    function updateCartTotal() {
        const cartItems = document.querySelectorAll('.cart-item');
        let total = 0;
        let anySelected = false;
    
        // Check if this is a guest user by looking for the guest checkout button
        const isGuestUser = document.getElementById('checkout-guest-btn') !== null;
        
        cartItems.forEach(item => {
            // For guest users, include all items in the total calculation regardless of selection
            // For authenticated users, only include selected items
            const checkbox = item.querySelector('input[type="checkbox"]');
            
            if ((isGuestUser || (checkbox && checkbox.checked))) {
                if (checkbox && checkbox.checked) {
                    anySelected = true;
                }
                
                // For guest users, we count all items as "selected" for total calculation purposes
                if (isGuestUser) {
                    anySelected = true;
                }
                
                const quantity = parseInt(item.querySelector('input[type="number"]').value) || 1;
                let unitPrice = 0;
                
                // Get unit price from data attributes first
                // Check if product is on sale first
                const isOnSale = item.querySelector('.text-green-600') !== null;
                if (isOnSale && item.dataset.salePrice) {
                    unitPrice = parseFloat(item.dataset.salePrice);
                } else if (item.dataset.unitPrice) {
                    unitPrice = parseFloat(item.dataset.unitPrice);
                }
                
                // Fallback to DOM elements if data attributes are not available
                if (unitPrice === 0) {
                    if (isOnSale) {
                        const salePriceElement = item.querySelector('.text-primary-600');
                        if (salePriceElement) {
                            unitPrice = parsePrice(salePriceElement.textContent);
                        }
                    } else {
                        const regularPriceElement = item.querySelector('.item-price');
                        if (regularPriceElement) {
                            unitPrice = parsePrice(regularPriceElement.textContent);
                        }
                    }
                }
                
                if (!isNaN(unitPrice) && unitPrice > 0) {
                    total += unitPrice * quantity;
                }
            }
        });
        

    
        const totalElement = document.querySelector('.cart-total');
        if (totalElement) {
            totalElement.textContent = formatPrice(total);
        }
        
        // Enable/disable checkout button based on selection for authenticated users
        // For guest users, enable the button if there are items in the cart
        const checkoutBtn = document.getElementById('checkout-btn');
        const guestCheckoutBtn = document.getElementById('checkout-guest-btn');
        
        if (checkoutBtn) {
            if (anySelected && total > 0) {
                checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                checkoutBtn.disabled = false;
                // Update Alpine.js binding if it exists
                if (checkoutBtn._x_dataStack && checkoutBtn._x_dataStack[0]) {
                    checkoutBtn._x_dataStack[0].disabled = false;
                }
            } else {
                checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
                checkoutBtn.disabled = true;
                // Update Alpine.js binding if it exists
                if (checkoutBtn._x_dataStack && checkoutBtn._x_dataStack[0]) {
                    checkoutBtn._x_dataStack[0].disabled = true;
                }
            }
        }
        
        // For guest checkout button, enable if there are items in the cart
        if (guestCheckoutBtn) {
            if (total > 0) {
                guestCheckoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                guestCheckoutBtn.disabled = false;
                // Update Alpine.js binding if it exists
                if (guestCheckoutBtn._x_dataStack && guestCheckoutBtn._x_dataStack[0]) {
                    guestCheckoutBtn._x_dataStack[0].disabled = false;
                }
            } else {
                guestCheckoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
                guestCheckoutBtn.disabled = true;
                // Update Alpine.js binding if it exists
                if (guestCheckoutBtn._x_dataStack && guestCheckoutBtn._x_dataStack[0]) {
                    guestCheckoutBtn._x_dataStack[0].disabled = true;
                }
            }
        }
        
        console.log(`Cart total updated: ${total}, Any selected: ${anySelected}, Is guest: ${isGuestUser}`);
    }

    const debouncedUpdate = debounce(updateItemPrice, 300);

    quantityInputs.forEach(input => {
        input.addEventListener('change', () => {
            // Get max inventory from the input's max attribute
            const maxInventory = parseInt(input.getAttribute('max')) || 1;
            // Ensure value doesn't exceed max inventory
            if (parseInt(input.value) > maxInventory) {
                input.value = maxInventory;
                createToast(`Maximum available quantity is ${maxInventory}`, 'warning');
            }
            debouncedUpdate(input);
        });
        input.addEventListener('input', () => {
            // Enforce min value of 1
            if (input.value < 1) input.value = 1;
            
            // Enforce max value based on inventory
            const maxInventory = parseInt(input.getAttribute('max')) || 1;
            if (parseInt(input.value) > maxInventory) {
                input.value = maxInventory;
            }
            debouncedUpdate(input);
        });
    });

    // Add a MutationObserver to monitor Alpine.js updates
    const alpineWatcher = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                const input = mutation.target;
                debouncedUpdate(input);
                // Also update selected items calculation when quantity changes via Alpine.js
                if (typeof window.updateSelectedItems === 'function') {
                    window.updateSelectedItems();
                }
            }
        });
    });

    // Observe all quantity inputs for value changes
    quantityInputs.forEach(input => {
        alpineWatcher.observe(input, { attributes: true });
    });

    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const input = button.parentElement.querySelector('input');
            let currentValue = parseInt(input.value) || 1;
            const maxInventory = parseInt(input.getAttribute('max')) || 1;
            const itemContainer = button.closest('.cart-item');
            const productId = itemContainer ? itemContainer.dataset.productId : null;

            if (button.classList.contains('decrease')) {
                currentValue = Math.max(1, currentValue - 1);
                input.value = currentValue;
                input.dispatchEvent(new Event('change'));
                updateCartTotal();
            } else if (button.classList.contains('increase')) {
                // Don't allow immediate increase if at max inventory from attribute
                if (currentValue >= maxInventory) {
                    createToast(`Maximum available quantity is ${maxInventory}`, 'warning');
                    // Disable the increase button visually when at max inventory
                    button.classList.add('opacity-50', 'cursor-not-allowed');
                    return;
                }
                // Re-enable the button if not at max inventory
                button.classList.remove('opacity-50', 'cursor-not-allowed');
                
                // Show loading overlay while validating quantity
                const overlay = createLoadingOverlay(itemContainer);
                
                // Validate with server before increasing
                if (productId) {
                    fetch(`/cart/validate_quantity/${productId}/?quantity=${currentValue + 1}`)
                        .then(response => response.json())
                        .then(data => {
                            // Ensure loading overlay stays visible for at least 2 seconds
                            const elapsedTime = Date.now() - overlay.startTime;
                            const minDisplayTime = 2000;
                            
                            setTimeout(() => {
                                if (data.valid) {
                                    currentValue += 1;
                                    input.value = currentValue;
                                    input.dispatchEvent(new Event('change'));
                                    updateCartTotal();
                                } else {
                                    createToast(`Maximum available quantity is ${data.max_quantity}`, 'warning');
                                }
                                overlay.remove();
                            }, Math.max(0, minDisplayTime - elapsedTime));
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            // Remove loading overlay after minimum display time
                            const elapsedTime = Date.now() - overlay.startTime;
                            const minDisplayTime = 2000;
                            
                            setTimeout(() => {
                                overlay.remove();
                                createToast('Error validating quantity', 'error');
                            }, Math.max(0, minDisplayTime - elapsedTime));
                        });
                } else {
                    // Fallback to client-side validation if productId not available
                    setTimeout(() => {
                        currentValue += 1;
                        input.value = currentValue;
                        input.dispatchEvent(new Event('change'));
                        updateCartTotal();
                        overlay.remove();
                    }, 2000); // Show loader for 2 seconds
                }
            }
        });
    });

    // Initialize checkboxes based on cart item's selected status
    document.querySelectorAll('.cart-item').forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) {
            // Add change event listener
            checkbox.addEventListener('change', () => updateCartTotal());
            
            // Check if this item has a 'selected' class or data attribute
            const isSelected = item.classList.contains('selected') || 
                              (item.dataset.selected === 'true');
            
            // Set the checkbox state based on the item's selection status
            checkbox.checked = isSelected;
        }
    });
    
    // Update cart total after initializing checkboxes
    updateCartTotal();
    
    // Initialize Alpine.js binding for checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn && window.Alpine) {
        // Wait for Alpine to initialize the component
        setTimeout(() => {
            if (checkoutBtn._x_dataStack && checkoutBtn._x_dataStack[0]) {
                checkoutBtn._x_dataStack[0].disabled = true;
            }
        }, 100);
    }
    
    // Add event listener to handle checkout button click
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            // Always prevent default action first
            e.preventDefault();
            
            // If button is disabled or no-click state, prevent any action
            if (this.disabled || this.classList.contains('cursor-not-allowed')) {
                createToast('Please select at least one product before proceeding to checkout', 'warning');
                return false;
            }
            
            // Get all selected items
            const selectedItems = document.querySelectorAll('.cart-item input[type="checkbox"]:checked');
            
            // If no items selected, prevent action
            if (selectedItems.length === 0) {
                createToast('Please select at least one product before proceeding to checkout', 'warning');
                return false;
            }
            
            // Verify at least one selected item has a valid price > 0
            let hasValidItem = false;
            selectedItems.forEach(item => {
                const cartItem = item.closest('.cart-item');
                const priceText = cartItem.querySelector('.item-price')?.textContent;
                if (priceText && parsePrice(priceText) > 0) {
                    hasValidItem = true;
                }
            });
            
            if (!hasValidItem) {
                createToast('Selected items must have valid prices to proceed to checkout', 'warning');
                return false;
            }
            
            // Check if user is authenticated
            const isAuthenticated = document.body.classList.contains('user-authenticated');
            
            // Only proceed if all checks pass
            const checkoutUrl = this.getAttribute('href');
            if (checkoutUrl) {
                // Redirect to cart for authenticated users, checkout for guests
                if (isAuthenticated) {
                    window.location.href = '/cart/';
                } else {
                    window.location.href = checkoutUrl;
                }
            }
        });
    }
    
    // Call this function to format prices on page load
    formatInitialPrices();
    
    // Initial total calculation
    updateCartTotal();
});