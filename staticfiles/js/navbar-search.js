/**
 * Navbar Product Search Functionality
 * Handles live search in the navigation bar using Alpine.js
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Alpine.js store for search functionality
    document.addEventListener('alpine:init', () => {
        // Check if store already exists to prevent duplicate initialization
        if (!Alpine.store('navbarSearch')) {
            Alpine.store('navbarSearch', {
                // Search state
                query: '',
                results: [],
                isSearching: false,
                showResults: false,
                mobileSearchOpen: false,
            
                // Search methods
                async search() {
                    if (this.query.length < 2) {
                        this.results = [];
                        this.showResults = false;
                        return;
                    }
                    
                    this.isSearching = true;
                    this.showResults = true;
                    
                    try {
                        const response = await fetch(`/shop/api/search/?q=${this.query}&limit=5`);
                        const data = await response.json();
                        this.results = data.products;
                    } catch (error) {
                        console.error('Search error:', error);
                        this.results = [];
                    } finally {
                        this.isSearching = false;
                    }
                },
            
                // Clear search
                clearSearch() {
                    this.query = '';
                    this.results = [];
                    this.showResults = false;
                },
                
                // Handle keyboard navigation
                handleKeyDown(event) {
                    if (event.key === 'Escape') {
                        this.showResults = false;
                    } else if (event.key === 'ArrowDown' && this.results.length > 0) {
                        event.preventDefault();
                        document.querySelector('.search-result-item')?.focus();
                    }
                },
                
                // Toggle mobile search
                toggleMobileSearch() {
                    this.mobileSearchOpen = !this.mobileSearchOpen;
                    if (!this.mobileSearchOpen) {
                        this.query = '';
                        this.results = [];
                    }
                }
            });
        }
    });
});