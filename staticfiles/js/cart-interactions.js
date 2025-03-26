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

    function updateItemPrice(quantityInput) {
        const itemContainer = quantityInput.closest('.cart-item');
        const priceElements = itemContainer.querySelectorAll('.item-price');
        let unitPrice = 0;
        
        // Get unit price from data attribute first
        if (itemContainer.dataset.unitPrice) {
            unitPrice = parseFloat(itemContainer.dataset.unitPrice);
        } else if (itemContainer.dataset.salePrice) {
            unitPrice = parseFloat(itemContainer.dataset.salePrice);
        }
        
        // Fallback to DOM elements if data attributes are not available
        if (unitPrice === 0) {
            const isOnSale = itemContainer.querySelector('.text-green-600') !== null;
            if (isOnSale) {
                const salePriceElement = itemContainer.querySelector('.text-primary-600');
                if (salePriceElement) {
                    unitPrice = parsePrice(salePriceElement.textContent);
                }
            } else {
                const regularPriceElement = itemContainer.querySelector('.text-gray-500');
                if (regularPriceElement) {
                    unitPrice = parsePrice(regularPriceElement.textContent);
                }
            }
        }
        
        const quantity = parseInt(quantityInput.value) || 1;
        if (isNaN(unitPrice) || unitPrice <= 0) {
            console.error('Invalid price:', { unitPrice });
            return;
        }

        console.log(`Unit Price: ${unitPrice}, Quantity: ${quantity}`);
        const productId = itemContainer.dataset.productId;

        if (isNaN(quantity) || quantity < 1) {
            quantityInput.value = 1;
            return;
        }

        fetch(`/cart/validate_quantity/${productId}/?quantity=${quantity}`)
            .then(response => response.json())
            .then(data => {
                if (data.valid) {
                    const totalPrice = unitPrice * quantity;
                    console.log(`Total Price: ${totalPrice}`);
                    // Update ALL price elements
                    priceElements.forEach(element => {
                        element.textContent = formatPrice(totalPrice);
                    });
                } else {
                    createToast(`Maximum available quantity is ${data.max_quantity}`, 'warning');
                    quantityInput.value = data.max_quantity;
                    const totalPrice = unitPrice * data.max_quantity;
                    // Update ALL price elements
                    priceElements.forEach(element => {
                        element.textContent = formatPrice(totalPrice);
                    });
                }
                updateCartTotal();
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function updateCartTotal() {
        const cartItems = document.querySelectorAll('.cart-item');
        let total = 0;
        let anySelected = false;
    
        cartItems.forEach(item => {
            // Only include selected items in the total calculation
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) {
                anySelected = true;
                const quantity = parseInt(item.querySelector('input[type="number"]').value) || 1;
                let unitPrice = 0;
                
                // Get unit price from data attributes first
                if (item.dataset.salePrice) {
                    unitPrice = parseFloat(item.dataset.salePrice);
                } else if (item.dataset.unitPrice) {
                    unitPrice = parseFloat(item.dataset.unitPrice);
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
        
        // Enable/disable checkout button based on selection
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            if (anySelected && total > 0) {
                checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                checkoutBtn.disabled = false;
            } else {
                checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
                checkoutBtn.disabled = true;
            }
        }
        
        console.log(`Cart total updated: ${total}, Any selected: ${anySelected}`);
    }

    const debouncedUpdate = debounce(updateItemPrice, 300);

    quantityInputs.forEach(input => {
        input.addEventListener('change', () => debouncedUpdate(input));
        input.addEventListener('input', () => {
            if (input.value < 1) input.value = 1;
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

            if (button.classList.contains('decrease')) {
                currentValue = Math.max(1, currentValue - 1);
            } else if (button.classList.contains('increase')) {
                currentValue += 1;
            }
            
            input.value = currentValue;
            input.dispatchEvent(new Event('change'));
            updateCartTotal();
        });
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => updateCartTotal());
    });

    // Call this function to format prices on page load
    formatInitialPrices();
    
    // Initial total calculation
    updateCartTotal();
});