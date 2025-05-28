// Alpine.js loader store initialization
// Initialize the store before Alpine.js is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  // Create a global object that will be available immediately
  window.AlpineLoaderStore = {
    loading: false
  };
  
  // When Alpine is ready, register the store
  document.addEventListener('alpine:init', () => {
    Alpine.store('loader', window.AlpineLoaderStore);
  });
});

// Show loader when needed
function showLoader() {
  if (Alpine.store('loader')) {
    Alpine.store('loader').loading = true;
  }
}

// Hide loader when needed
function hideLoader() {
  if (Alpine.store('loader')) {
    Alpine.store('loader').loading = false;
  }
}

// Initialize loader on window load
window.addEventListener('load', () => {
  hideLoader();
});