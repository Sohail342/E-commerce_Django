/**
 * Enhanced mobile experience for side cart
 */

document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const sideCart = document.getElementById('side-cart');
  const sideCartOverlay = document.getElementById('side-cart-overlay');
  const closeCartBtn = document.getElementById('close-side-cart');
  const continueShoppingBtn = document.getElementById('continue-shopping');
  
  // Function to open cart
  function openCart() {
    sideCart.classList.remove('translate-x-full');
    sideCartOverlay.classList.remove('hidden');
    sideCartOverlay.classList.add('opacity-100');
    document.body.classList.add('cart-open');
    
    // Apply safe area insets for mobile devices
    applyMobileSafeArea();
  }
  
  // Function to close cart
  function closeCart() {
    sideCart.classList.add('translate-x-full');
    sideCartOverlay.classList.remove('opacity-100');
    
    // Use setTimeout to match the transition duration
    setTimeout(() => {
      sideCartOverlay.classList.add('hidden');
      document.body.classList.remove('cart-open');
    }, 300);
  }
  
  // Apply mobile safe area insets
  function applyMobileSafeArea() {
    if (window.innerWidth <= 640) { // Mobile breakpoint
      // Use CSS environment variables for safe area insets
      const safeAreaBottom = 'env(safe-area-inset-bottom, 0px)';
      sideCart.style.paddingBottom = `calc(1.25rem + ${safeAreaBottom})`;
    }
  }
  
  // Event listeners
  if (closeCartBtn) {
    closeCartBtn.addEventListener('click', closeCart);
  }
  
  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener('click', closeCart);
  }
  
  if (sideCartOverlay) {
    sideCartOverlay.addEventListener('click', closeCart);
  }
  
  // Handle resize events to reapply safe area
  window.addEventListener('resize', applyMobileSafeArea);
  
  // Apply touch feedback to all mobile touch elements
  const touchElements = document.querySelectorAll('.mobile-touch-feedback');
  touchElements.forEach(element => {
    element.addEventListener('touchstart', () => {
      element.classList.add('active');
    });
    
    element.addEventListener('touchend', () => {
      element.classList.remove('active');
    });
  });
  
  // Initial setup
  applyMobileSafeArea();
});