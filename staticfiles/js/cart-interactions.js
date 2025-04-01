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

// Add CSS for loading overlay, hide checkboxes for guest users, and style selected items
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
    body:not(.user-authenticated) .cart-item-selection {
        display: none !important;
    }
    body:not(.user-authenticated) .selection-header {
        display: none !important;
    }
    .select-all-container {
        margin-bottom: 0.75rem;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.75rem;
    }
    .cart-item.selected {
        background-color: rgba(59, 130, 246, 0.05);
        border-left: 3px solid #3b82f6;
    }
    .user-authenticated .cart-item {
        transition: background-color 0.2s, border-left 0.2s;
        border-left: 3px solid transparent;
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
        const isGuestUser = !document.body.classList.contains('user-authenticated');
        
        // For guest users, automatically set anySelected to true if there are cart items
        if (isGuestUser && cartItems.length > 0) {
            anySelected = true;
        }
        // For authenticated users, don't automatically select any items
    
        cartItems.forEach(item => {
            // For guest users, all items are considered selected
            // For authenticated users, only selected items are considered
            const checkbox = item.querySelector('input[type="checkbox"]');
            const isItemSelected = isGuestUser || (checkbox && checkbox.checked);
            
            if (isItemSelected) {
                anySelected = true;
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
                
                // Visually highlight selected items for authenticated users
                if (!isGuestUser) {
                    item.classList.add('selected');
                }
            } else if (!isGuestUser) {
                // Remove highlight from unselected items for authenticated users
                item.classList.remove('selected');
            }
        });
        
        // Update the cart total display
        const totalElement = document.querySelector('.cart-total');
        if (totalElement) {
            // For authenticated users, show a message if no items are selected
            if (!isGuestUser && !anySelected) {
                totalElement.textContent = "No items selected";
            } else {
                totalElement.textContent = formatPrice(total);
            }
        }
        
        // Enable/disable checkout button based on selection
        const checkoutBtn = document.getElementById('checkout-btn');
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
        
        console.log(`Cart total updated: ${total}, Any selected: ${anySelected}`);
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

    // Ensure checkbox change events trigger cart total update
    document.querySelectorAll('.cart-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateCartTotal();
            
            // Send selection to server if needed
            if (typeof window.updateSelectedItems === 'function') {
                window.updateSelectedItems();
            }
        });
    });

    // Initialize checkboxes based on cart item's selected status
    const isGuestUser = !document.body.classList.contains('user-authenticated');

    // Add "Select All" checkbox for authenticated users
    if (!isGuestUser) {
        // First, ensure all checkboxes are unchecked by default for authenticated users
        document.querySelectorAll('.cart-item input[type="checkbox"]').forEach(checkbox => {
            // Explicitly set to false and remove any checked attribute
            checkbox.checked = false;
            checkbox.removeAttribute('checked');
            checkbox.addEventListener('change', () => {
                // Update cart total in real-time when checkbox state changes
                updateCartTotal();
            });
        });
    }
        
        document.querySelectorAll('.cart-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const hiddenInput = item.querySelector('input[type="hidden"]');
            
            if (checkbox) {
                // Add change event listener for authenticated users
                checkbox.addEventListener('change', () => {
                    // Update cart total immediately when checkbox state changes
                    updateCartTotal();
                    
                    // Update select all checkbox state
                    if (!isGuestUser) {
                        const selectAllCheckbox = document.getElementById('select-all-items');
                        if (selectAllCheckbox) {
                            const allCheckboxes = document.querySelectorAll('.cart-item input[type="checkbox"]');
                            const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
                            selectAllCheckbox.checked = allChecked;
                        }
                    }
                    
                    // Send selection to server if needed
                    if (typeof window.updateSelectedItems === 'function') {
                        window.updateSelectedItems();
                    }
                });
                
                // For guest users, always set checked to true
                // For authenticated users, NEVER check by default - let user select items
                if (isGuestUser) {
                    checkbox.checked = true;
                } else {
                    // Ensure checkboxes are unchecked for authenticated users
                    checkbox.checked = false;
                    // Remove the checked attribute entirely instead of setting it to false
                    checkbox.removeAttribute('checked');
                }
                
                // Only trigger change event for guest users to avoid auto-selecting for authenticated users
                if (isGuestUser) {
                    checkbox.dispatchEvent(new Event('change'));
                }
            } else if (hiddenInput || isGuestUser) {
                // For guest users, items are always selected
                item.classList.add('selected');
            }
        });
    
        // Ensure all checkboxes are properly unchecked for authenticated users
        if (!isGuestUser) {
            // Force all checkboxes to be unchecked
            document.querySelectorAll('.cart-item input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
                // Remove any checked attribute that might be set in HTML
                checkbox.removeAttribute('checked');
            });
            
            // Prevent any automatic selection for authenticated users
            document.querySelectorAll('.cart-item').forEach(item => {
                item.classList.remove('selected');
            });
        }
    
        // Make sure to update cart total when page loads
        // For authenticated users, don't auto-select items
        if (isGuestUser) {
            updateCartTotal();
        } else {
            // For authenticated users, update the cart total without triggering selection
            const cartItems = document.querySelectorAll('.cart-item');
            cartItems.forEach(item => {
                item.classList.remove('selected');
            });
            
            // Show "No items selected" message for authenticated users
            const totalElement = document.querySelector('.cart-total');
            if (totalElement) {
                totalElement.textContent = "No items selected";
            }
            
            // Disable checkout button
            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) {
                checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
                checkoutBtn.disabled = true;
                // Update Alpine.js binding if it exists
                if (checkoutBtn._x_dataStack && checkoutBtn._x_dataStack[0]) {
                    checkoutBtn._x_dataStack[0].disabled = true;
                }
            }
        }
        
        // Update select all checkbox initial state for authenticated users
        if (!isGuestUser) {
            const selectAllCheckbox = document.getElementById('select-all-items');
            if (selectAllCheckbox) {
                // For authenticated users, we want the select all checkbox to be unchecked by default
                selectAllCheckbox.checked = false;
                selectAllCheckbox.removeAttribute('checked');
                
                // Make sure all item checkboxes are unchecked initially
                document.querySelectorAll('.cart-item input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = false;
                    checkbox.removeAttribute('checked');
                });
                
                // Add event listener to select-all checkbox
                selectAllCheckbox.addEventListener('change', function() {
                    const isChecked = this.checked;
                    
                    // Update all item checkboxes
                    document.querySelectorAll('.cart-item input[type="checkbox"]').forEach(checkbox => {
                        checkbox.checked = isChecked;
                        // Trigger change event to update UI
                        checkbox.dispatchEvent(new Event('change'));
                    });
                    
                    // Update cart total
                    updateCartTotal();
                    
                    // Send selection to server if needed
                    if (typeof window.updateSelectedItems === 'function') {
                        window.updateSelectedItems();
                    }
                });
            }
        }
    
        
        // Update cart total after initializing checkboxes
        // For authenticated users, this should show zero since no items are selected by default
        
        // IMPORTANT: Final check to ensure all checkboxes are unchecked for authenticated users
        // This is the last operation before updating the cart total to ensure nothing overrides it
        if (!isGuestUser) {
            document.querySelectorAll('.cart-item input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
                // Remove any checked attribute that might be set in HTML
                checkbox.removeAttribute('checked');
            });
            
            // Also ensure the select-all checkbox is unchecked
            const selectAllCheckbox = document.getElementById('select-all-items');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.removeAttribute('checked');
            }
        }
        
        updateCartTotal();
        
        // Initialize Alpine.js binding for checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn && window.Alpine) {
            // Wait for Alpine to initialize the component
            setTimeout(() => {
                if (checkoutBtn._x_dataStack && checkoutBtn._x_dataStack[0]) {
                    // For authenticated users, initially disable the checkout button since no items are selected
                    if (!isGuestUser) {
                        checkoutBtn._x_dataStack[0].disabled = true;
                    }
                }
            }, 100);
        }
        
        // Add event listener to handle checkout button click
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function(e) {
                // Always prevent default action first
                e.preventDefault();
                
                const isGuestUser = !document.body.classList.contains('user-authenticated');
                
                // For guest users with items in cart, always allow checkout
                if (isGuestUser) {
                    const cartItems = document.querySelectorAll('.cart-item');
                    if (cartItems.length > 0) {
                        // Only proceed if the button is not explicitly disabled
                        if (!this.disabled) {
                            const checkoutUrl = this.getAttribute('href');
                            if (checkoutUrl) {
                                window.location.href = checkoutUrl;
                                return;
                            }
                        }
                    } else {
                        createToast('Your cart is empty', 'warning');
                        return false;
                    }
                }
                
                // For authenticated users, continue with normal flow
                // If button is disabled or no-click state, prevent any action
                if (this.disabled || this.classList.contains('cursor-not-allowed')) {
                    createToast('Please ensure you have items in your cart before proceeding to checkout', 'warning');
                    return false;
                }
                
                // Get all selected items, considering guest users
                const selectedItems = isGuestUser ? 
                    document.querySelectorAll('.cart-item') : 
                    document.querySelectorAll('.cart-item input[type="checkbox"]:checked');
                
                // If no items selected, prevent action
                if (selectedItems.length === 0) {
                    createToast('Please ensure you have items in your cart before proceeding to checkout', 'warning');
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