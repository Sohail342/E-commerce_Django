/**
 * Main JavaScript File
 * Contains common utility functions and initialization code for the entire site
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize common functionality
    initializeCommonFunctions();
    
    // Setup global event listeners
    setupGlobalEventListeners();
    
    // Initialize animations
    initializeAnimations();
});

/**
 * Initialize common functions used throughout the site
 */
function initializeCommonFunctions() {
    // Make utility functions globally available
    window.showToast = function(message, type = 'info') {
        if (typeof createToast === 'function') {
            createToast(message, type);
        }
    };
    
    // Format price consistently across the site
    window.formatPrice = function(price) {
        return `PKR ${parseFloat(price).toFixed(2)}`;
    };
    
    // Parse price from formatted string
    window.parsePrice = function(priceText) {
        return parseFloat(priceText.replace('PKR ', '').replace(/,/g, ''));
    };
    
    // Debounce function to limit how often a function is called
    window.debounce = function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
}

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        const openModals = document.querySelectorAll('.modal.is-active');
        if (openModals.length > 0) {
            openModals.forEach(modal => {
                if (event.target.closest('.modal-content') === null && 
                    !event.target.classList.contains('modal-trigger')) {
                    modal.classList.remove('is-active');
                }
            });
        }
    });
    
    // Handle back to top button
    const backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.remove('hidden');
                backToTopButton.classList.add('flex');
            } else {
                backToTopButton.classList.remove('flex');
                backToTopButton.classList.add('hidden');
            }
        });
        
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/**
 * Initialize animations for elements
 */
function initializeAnimations() {
    // Add animation classes to elements with data-animate attribute
    const animatedElements = document.querySelectorAll('[data-animate]');
    animatedElements.forEach(element => {
        const animationType = element.getAttribute('data-animate');
        if (animationType) {
            element.classList.add(`animate-${animationType}`);
        }
    });
}