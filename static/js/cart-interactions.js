document.addEventListener('DOMContentLoaded', () => {
    const cartItems = document.querySelectorAll('.cart-item');
    
    // Initialize cart total on page load
    updateCartTotal();
    const checkoutBtn = document.querySelector('.checkout-btn');
    const spinner = document.querySelector('.checkout-btn .spinner');

    // Animate cart items on page load
    cartItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Handle quantity updates
    document.querySelectorAll('.cart-item-quantity').forEach(container => {
        const decreaseBtn = container.querySelector('.quantity-btn:first-child');
        const increaseBtn = container.querySelector('.quantity-btn:last-child');
        const input = container.querySelector('.quantity-input');
        const itemTotal = container.closest('.cart-item').querySelector('.cart-item-total');
        const itemPrice = parseFloat(container.closest('.cart-item').querySelector('.cart-item-price').textContent.replace(/[^0-9.]/g, ''));

        decreaseBtn.addEventListener('click', () => updateQuantity(-1));
        increaseBtn.addEventListener('click', () => updateQuantity(1));
        input.addEventListener('change', () => validateInput());

        function updateQuantity(change) {
            const currentValue = parseInt(input.value) || 0;
            const newValue = Math.max(1, currentValue + change);
            input.value = newValue;
            updateTotal(newValue);
            updateCartTotal();
        }

        function validateInput() {
            let value = parseInt(input.value) || 1;
            value = Math.max(1, value);
            input.value = value;
            updateTotal(value);
            updateCartTotal();
        }

        function updateTotal(quantity) {
            const total = (itemPrice * quantity).toFixed(2);
            itemTotal.textContent = `PKR ${total}`;
        }
    });

    // Handle remove item
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.cart-item');
            item.style.opacity = '0';
            item.style.transform = 'translateX(100px)';
            setTimeout(() => {
                item.remove();
                updateCartTotal();
                checkEmptyCart();
            }, 300);
        });
    });

    // Update cart total
    function updateCartTotal() {
        const totals = Array.from(document.querySelectorAll('.cart-item-total'))
            .map(el => parseFloat(el.textContent.replace(/[^0-9.]/g, '')));
        const total = totals.reduce((sum, price) => sum + price, 0).toFixed(2);
        document.querySelector('.cart-total span:last-child').textContent = `PKR ${total}`;
    }

    // Check if cart is empty
    function checkEmptyCart() {
        const items = document.querySelectorAll('.cart-item');
        if (items.length === 0) {
            const emptyCart = document.createElement('div');
            emptyCart.className = 'empty-cart';
            emptyCart.innerHTML = `
                <h3>Your cart is empty</h3>
                <a href="/" class="continue-shopping">Continue Shopping</a>
            `;
            document.querySelector('.cart-section .container').innerHTML = '';
            document.querySelector('.cart-section .container').appendChild(emptyCart);
        }
    }

    // Handle checkout
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            checkoutBtn.classList.add('loading');
            spinner.style.display = 'block';

            // Simulate checkout process
            setTimeout(() => {
                window.location.href = checkoutBtn.href;
            }, 1500);
        });
    }
});