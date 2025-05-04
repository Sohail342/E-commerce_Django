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
            
                // Search methods
                async search() {
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
                            
                            // Force the search results to be visible immediately
                            const dropdown = document.getElementById('searchResultsDropdown');
                            if (dropdown) {
                                dropdown.style.display = 'block';
                                dropdown.classList.add('search-popup');
                                dropdown.classList.remove('hidden');
                                dropdown.style.opacity = '1';
                                dropdown.style.zIndex = '50';
                            }
                            
                            // Use Alpine's nextTick to ensure DOM is updated after data changes
                            if (typeof Alpine !== 'undefined') {
                                Alpine.nextTick(() => {
                                    // DESKTOP: Make search results dropdown visible with popup styling
                                    const dropdown = document.getElementById('searchResultsDropdown');
                                    if (dropdown) {
                                        // Force display block to override any inline styles
                                        dropdown.style.display = 'block';
                                        dropdown.classList.add('search-popup');
                                        dropdown.classList.remove('hidden');
                                        
                                        // Ensure the dropdown is visible by setting opacity and z-index
                                        dropdown.style.opacity = '1';
                                        dropdown.style.zIndex = '50';
                                    }
                                    
                                    // MOBILE: Handle mobile search results if mobile search is open
                                    if (this.mobileSearchOpen) {
                                        // Find mobile results container
                                        const mobileResultsContainer = document.querySelector('.grid.grid-cols-1.gap-3');
                                        if (mobileResultsContainer) {
                                            mobileResultsContainer.style.display = 'grid';
                                        }
                                        
                                        // Make sure the "Found products" text is visible
                                        const foundProductsText = document.querySelector('.flex.items-center.justify-between.mb-4');
                                        if (foundProductsText) {
                                            foundProductsText.style.display = 'flex';
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
                    } catch (error) {
                        console.error('Search error:', error);
                        this.results = [];
                        this.toggleBlurOverlay(false);
                    } finally {
                        this.isSearching = false;
                    }
                },
            
                // Clear search
                clearSearch() {
                    this.query = '';
                    this.results = [];
                    this.showResults = false;
                    this.toggleBlurOverlay(false);
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
                        
                        // Make sure search results are visible when overlay is shown
                        if (this.results && this.results.length > 0) {
                            const dropdown = document.getElementById('searchResultsDropdown');
                            if (dropdown) {
                                dropdown.style.display = 'block';
                                dropdown.classList.add('search-popup');
                                dropdown.classList.remove('hidden');
                                dropdown.style.opacity = '1';
                                dropdown.style.zIndex = '50';
                            }
                        }
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
                    console.log('Mobile search toggled:', this.mobileSearchOpen);
                    
                    if (this.mobileSearchOpen) {
                        // When opening mobile search
                        
                        // Show blur overlay for mobile search too
                        this.toggleBlurOverlay(true);
                        
                        // Use Alpine's nextTick to ensure DOM is updated after state changes
                        if (typeof Alpine !== 'undefined') {
                            Alpine.nextTick(() => {
                                // Find the mobile search overlay container
                                const mobileSearchOverlay = document.querySelector('.fixed.inset-0.z-\\[9999\\].bg-white.p-4');
                                if (mobileSearchOverlay) {
                                    mobileSearchOverlay.style.display = 'block';
                                    // Add popup styling to mobile search
                                    mobileSearchOverlay.classList.add('search-popup');
                                }
                                
                                // If we already have results, make sure they're visible
                                if (this.results && this.results.length > 0) {
                                    this.showResults = true;
                                    
                                    // Find and show the mobile results container
                                    const resultsContainer = document.querySelector('.grid.grid-cols-1.gap-3');
                                    if (resultsContainer) {
                                        resultsContainer.style.display = 'grid';
                                    }
                                    
                                    // Show the "Found products" text
                                    const foundProductsText = document.querySelector('.flex.items-center.justify-between.mb-4');
                                    if (foundProductsText) {
                                        foundProductsText.style.display = 'flex';
                                    }
                                }
                                
                                // Focus the search input
                                setTimeout(() => {
                                    const mobileSearchInput = mobileSearchOverlay?.querySelector('input[type="text"]');
                                    if (mobileSearchInput) {
                                        mobileSearchInput.focus();
                                    }
                                }, 50);
                            });
                        }
                    } else {
                        // When closing mobile search, reset search state
                        this.query = '';
                        this.results = [];
                        this.showResults = false;
                        
                        // Hide blur overlay when closing mobile search
                        this.toggleBlurOverlay(false);
                        
                        // Hide mobile search overlay
                        const mobileSearchOverlay = document.querySelector('.fixed.inset-0.z-\\[9999\\].bg-white.p-4');
                        if (mobileSearchOverlay) {
                            mobileSearchOverlay.style.display = 'none';
                            // Remove popup styling
                            mobileSearchOverlay.classList.remove('search-popup');
                        }
                    }
                }
            });
        }
    }
});

