document.addEventListener('DOMContentLoaded', function() {
    const quantityInputs = document.querySelectorAll('input[type="number"]');

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

    function updateItemPrice(quantityInput) {
        const itemContainer = quantityInput.closest('.cart-item');
        // Get ALL price elements in this container, both mobile and desktop
        const priceElements = itemContainer.querySelectorAll('.item-price');
        const unitPrice = parseFloat(itemContainer.dataset.unitPrice);
        const quantity = parseInt(quantityInput.value);

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
                        element.textContent = `PKR ${totalPrice.toFixed(2)}`;
                    });
                } else {
                    createToast(`Maximum available quantity is ${data.max_quantity}`, 'warning');
                    quantityInput.value = data.max_quantity;
                    const totalPrice = unitPrice * data.max_quantity;
                    // Update ALL price elements
                    priceElements.forEach(element => {
                        element.textContent = `PKR ${totalPrice.toFixed(2)}`;
                    });
                }
                updateCartTotal();
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function updateCartTotal() {
        // Use a better selector to get only one price element per item
        const cartItems = document.querySelectorAll('.cart-item');
        let total = 0;
    
        cartItems.forEach(item => {
            // Get the first price element that's not in a hidden container
            const priceElement = item.querySelector('.item-price');
            if (priceElement) {
                const priceText = priceElement.textContent.replace('PKR ', '');
                const price = parseFloat(priceText);
                if (!isNaN(price)) {
                    total += price;
                }
            }
        });
    
        const totalElement = document.querySelector('.cart-total');
        if (totalElement) {
            totalElement.textContent = `PKR ${total.toFixed(2)}`;
        }
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
        });
    });

    // Initial total calculation
    updateCartTotal();
});