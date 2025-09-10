/**
 * Alpine.js Loader Store
 * Initializes the loader store for Alpine.js
 */

document.addEventListener('alpine:init', function() {
    // Initialize loader store if it doesn't exist
    if (typeof Alpine !== 'undefined' && !Alpine.store('loader')) {
        Alpine.store('loader', {
            loading: false,
            
            // Show loader
            show() {
                this.loading = true;
            },
            
            // Hide loader
            hide() {
                this.loading = false;
            },
            
            // Toggle loader state
            toggle() {
                this.loading = !this.loading;
            }
        });
    }
});