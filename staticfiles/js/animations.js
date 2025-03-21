// Enhanced UI animations and transitions

document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS for scroll animations
    AOS.init({
        duration: 800,
        easing: 'ease',
        once: true
    });

    // Add loading indicator for images
    const images = document.querySelectorAll('.img-prod img');
    images.forEach(img => {
        img.addEventListener('load', () => {
            img.classList.add('loaded');
            img.parentElement.classList.add('loaded');
        });
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Enhanced button hover effects
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', (e) => {
            const x = e.pageX - button.offsetLeft;
            const y = e.pageY - button.offsetTop;
            button.style.setProperty('--x', `${x}px`);
            button.style.setProperty('--y', `${y}px`);
        });
    });

    // Cart item animations
    const cartItems = document.querySelectorAll('.cart-item');
    cartItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
        item.classList.add('fade-in');
    });

    // Form input animations
    const formInputs = document.querySelectorAll('input, textarea');
    formInputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
    });

    // Product card hover animations
    const products = document.querySelectorAll('.product');
    products.forEach(product => {
        product.addEventListener('mouseenter', () => {
            product.classList.add('hover');
        });
        product.addEventListener('mouseleave', () => {
            product.classList.remove('hover');
        });
    });

    // Loading spinner for async actions
    const addLoadingSpinner = (element) => {
        element.classList.add('loading');
        element.insertAdjacentHTML('beforeend', '<div class="spinner"></div>');
    };

    const removeLoadingSpinner = (element) => {
        element.classList.remove('loading');
        const spinner = element.querySelector('.spinner');
        if (spinner) spinner.remove();
    };

    // Apply loading spinner to forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', () => {
            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) addLoadingSpinner(submitBtn);
        });
    });

    // Page transition effects
    window.addEventListener('pageshow', () => {
        document.body.classList.add('page-loaded');
    });

    // Initialize custom dropdown animations
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', (e) => {
            e.preventDefault();
            const menu = dropdown.nextElementSibling;
            menu.classList.toggle('show');
            menu.style.animation = menu.classList.contains('show') ? 
                'slideDown 0.3s ease forwards' : 
                'slideUp 0.3s ease forwards';
        });
    });
}));