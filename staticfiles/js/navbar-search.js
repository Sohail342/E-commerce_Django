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
                        const response = await fetch(`/shop/api/search/?q=${encodeURIComponent(this.query)}&limit=5`);
                        if (!response.ok) {
                            throw new Error(`Search API error: ${response.status}`);
                        }
                        const data = await response.json();
                        this.results = data.products;
                        console.log('Search results:', this.results);
                        
                        // Ensure Alpine.js reactivity by properly setting state
                        if (this.results && this.results.length > 0) {
                            // Make sure showResults is true
                            this.showResults = true;
                            
                            // Use Alpine's nextTick to ensure DOM is updated
                            if (typeof Alpine !== 'undefined') {
                                Alpine.nextTick(() => {
                                    // For desktop view
                                    const dropdown = document.getElementById('searchResultsDropdown');
                                    if (dropdown) {
                                        dropdown.removeAttribute('style');
                                    }
                                    
                                    // For mobile view
                                    if (this.mobileSearchOpen) {
                                        const mobileResultsContainer = document.querySelector('.grid.grid-cols-1.gap-3');
                                        if (mobileResultsContainer) {
                                            mobileResultsContainer.removeAttribute('style');
                                        }
                                    }
                                });
                            }
                        }
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