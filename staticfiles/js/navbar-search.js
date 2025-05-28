/**
 * Navbar Product Search Functionality
 * Handles live search in the navigation bar using Alpine.js
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Alpine.js store for search functionality
    if (typeof Alpine !== 'undefined') {
        initAlpineStore();
    } else {
        // If Alpine isn't loaded yet, wait for it
        document.addEventListener('alpine:init', initAlpineStore);
    }
    
    // Add blur overlay element to the DOM
    const blurOverlay = document.createElement('div');
    blurOverlay.id = 'search-blur-overlay';
    blurOverlay.className = 'fixed inset-0 bg-black/30 backdrop-blur-sm z-40 hidden transition-opacity duration-300 opacity-0';
    document.body.appendChild(blurOverlay);
    
    // Add click event to close search when clicking outside
    blurOverlay.addEventListener('click', function() {
        if (Alpine && Alpine.store('navbarSearch')) {
            // Close desktop search results
            Alpine.store('navbarSearch').showResults = false;
            Alpine.store('navbarSearch').toggleBlurOverlay(false);
            
            // If mobile search is open, close it
            if (Alpine.store('navbarSearch').mobileSearchOpen) {
                Alpine.store('navbarSearch').toggleMobileSearch();
            }
        }
    });
    
    function initAlpineStore() {
        // Check if store already exists to prevent duplicate initialization
        if (!Alpine.store('navbarSearch')) {
            Alpine.store('navbarSearch', {
                // Search state
                query: '',
                results: [],
                isSearching: false,
                showResults: false,
                mobileSearchOpen: false,
                searchTimeout: null,
            
                // Search methods
                async search() {
                    // Clear any existing timeout
                    if (this.searchTimeout) {
                        clearTimeout(this.searchTimeout);
                    }
                    
                    // Set a new timeout for debouncing
                    this.searchTimeout = setTimeout(async () => {
                        if (this.query.length < 2) {
                            this.results = [];
                            this.showResults = false;
                            this.toggleBlurOverlay(false);
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
                            
                            // Set results and ensure UI updates properly
                            if (data.products && data.products.length > 0) {
                                // First set the results
                                this.results = data.products;
                                console.log('Search results:', this.results);
                                
                                // Show blur overlay immediately
                                this.toggleBlurOverlay(true);
                                
                                // Force showResults to be true
                                this.showResults = true;
                                
                                // Use Alpine's nextTick to ensure DOM is updated
                                if (typeof Alpine !== 'undefined') {
                                    Alpine.nextTick(() => {
                                        // For desktop view
                                        const dropdown = document.getElementById('searchResultsDropdown');
                                        if (dropdown) {
                                            // Make sure the dropdown is visible by removing any inline style
                                            dropdown.removeAttribute('style');
                                            dropdown.classList.add('search-popup');
                                            dropdown.classList.remove('hidden');
                                            
                                            // Force display block to override any conflicting styles
                                            dropdown.setAttribute('style', 'display: block !important');
                                            
                                            // Add important flag to ensure visibility
                                            document.documentElement.style.setProperty('--search-display', 'block !important');
                                            
                                            // Ensure Alpine.js doesn't override our display setting
                                            setTimeout(() => {
                                                if (dropdown && !dropdown.classList.contains('search-active')) {
                                                    dropdown.classList.add('search-active');
                                                }
                                            }, 50);
                                        }
                                        
                                        // For mobile view
                                        if (this.mobileSearchOpen) {
                                            const mobileResultsContainer = document.querySelector('.grid.grid-cols-1.gap-4');
                                            if (mobileResultsContainer) {
                                                // Remove inline style that might be conflicting with Alpine's x-show directive
                                                mobileResultsContainer.removeAttribute('style');
                                                // Force display grid with !important to override Alpine.js
                                                mobileResultsContainer.setAttribute('style', 'display: grid !important');
                                                
                                                // Add search-active class to ensure visibility
                                                if (!mobileResultsContainer.classList.contains('search-active')) {
                                                    mobileResultsContainer.classList.add('search-active');
                                                }
                                            }
                                        }
                                    });
                                }
                            } else {
                                this.results = [];
                                this.toggleBlurOverlay(false);
                            }
                            
                            // Ensure showResults flag is set correctly
                            this.showResults = this.results.length > 0;
                            
                            // Force Alpine to recognize the state change
                            if (typeof Alpine !== 'undefined' && this.results.length > 0) {
                                Alpine.effect(() => {
                                    console.log('Search results updated, triggering Alpine reactivity');
                                });
                            }
                        } catch (error) {
                            console.error('Search error:', error);
                            this.results = [];
                            this.toggleBlurOverlay(false);
                        } finally {
                            this.isSearching = false;
                        }
                    }, 300); // 300ms debounce
                },
            
                // Clear search
                clearSearch() {
                    this.query = '';
                    this.results = [];
                    this.showResults = false;
                    this.toggleBlurOverlay(false);
                    
                    // Clear any existing timeout
                    if (this.searchTimeout) {
                        clearTimeout(this.searchTimeout);
                    }
                },
                
                // Toggle blur overlay
                toggleBlurOverlay(show) {
                    const overlay = document.getElementById('search-blur-overlay');
                    if (!overlay) return;
                    
                    if (show) {
                        overlay.classList.remove('hidden');
                        // Use setTimeout to ensure the transition works
                        setTimeout(() => {
                            overlay.classList.add('opacity-100');
                            overlay.classList.remove('opacity-0');
                        }, 10);
                    } else {
                        overlay.classList.remove('opacity-100');
                        overlay.classList.add('opacity-0');
                        // Wait for transition to complete before hiding
                        setTimeout(() => {
                            overlay.classList.add('hidden');
                        }, 300);
                    }
                },
                
                // Handle keyboard navigation
                handleKeyDown(event) {
                    if (event.key === 'Escape') {
                        this.showResults = false;
                        this.toggleBlurOverlay(false);
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
                        this.toggleBlurOverlay(false);
                    } else {
                        // Focus the search input when mobile search is opened
                        setTimeout(() => {
                            const mobileSearchInput = document.querySelector('.mobile-search input[type="text"]');
                            if (mobileSearchInput) {
                                mobileSearchInput.focus();
                            }
                        }, 100);
                    }
                }
            });
        }
    }
});

