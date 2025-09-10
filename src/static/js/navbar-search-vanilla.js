/**
 * Navbar Product Search Functionality
 * Vanilla JavaScript implementation for live search in the navigation bar
 * Updated with increased search results container width
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize search functionality
    initSearchFunctionality();
    
    // Apply custom search styles
    applySearchWidthStyles();
    
    // Add blur overlay element to the DOM
    const blurOverlay = document.createElement('div');
    blurOverlay.id = 'search-blur-overlay';
    blurOverlay.className = 'fixed inset-0 bg-black/30 backdrop-blur-sm z-40 hidden transition-opacity duration-300 opacity-0';
    document.body.appendChild(blurOverlay);
    
    // Add click event to close search when clicking outside
    blurOverlay.addEventListener('click', function() {
        // Close desktop search results
        hideSearchResults();
        toggleBlurOverlay(false);
        
        // If mobile search is open, close it
        if (isMobileSearchOpen()) {
            toggleMobileSearch();
        }
    });
});

// Global state for search functionality
const searchState = {
    query: '',
    results: [],
    isSearching: false,
    showResults: false,
    mobileSearchOpen: false,
    searchTimeout: null
};

function applySearchWidthStyles() {
    // Check if styles are already applied
    if (document.getElementById('search-width-styles')) {
        return;
    }
    
    // Create and append style element
    const styleElement = document.createElement('style');
    styleElement.id = 'search-width-styles';
    styleElement.textContent = `
        /* Desktop search results container - increased width */
        #searchResultsDropdown {
            width: 600px !important;
            max-width: 90vw !important;
            min-width: 400px !important;
        }
        
        /* Responsive width adjustments */
        @media (min-width: 640px) {
            #searchResultsDropdown {
                width: 500px !important;
            }
        }
        
        @media (min-width: 768px) {
            #searchResultsDropdown {
                width: 600px !important;
            }
        }
        
        @media (min-width: 1024px) {
            #searchResultsDropdown {
                width: 700px !important;
            }
        }
        
        @media (min-width: 1280px) {
            #searchResultsDropdown {
                width: 800px !important;
            }
        }
        
        /* No results container width */
        .search-no-results {
            width: 600px !important;
            max-width: 90vw !important;
        }
        
        @media (min-width: 768px) {
            .search-no-results {
                width: 600px !important;
            }
        }
        
        @media (min-width: 1024px) {
            .search-no-results {
                width: 700px !important;
            }
        }
        
        @media (min-width: 1280px) {
            .search-no-results {
                width: 800px !important;
            }
        }
        
        /* Ensure mobile search uses full available width */
        .fixed.inset-0.z-\\[9999\\] .grid.grid-cols-1.gap-4 {
            width: 100% !important;
            max-width: none !important;
            padding: 0 1rem !important;
        }
        
        /* Search result items - ensure they fill the container */
        .search-result-item {
            width: 100% !important;
            min-width: 100% !important;
        }
        
        /* Enhanced animations for wider container */
        .search-popup {
            animation: searchPopupEnter 0.2s ease-out;
        }
        
        @keyframes searchPopupEnter {
            from {
                opacity: 0;
                transform: translateY(-10px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
    `;
    
    document.head.appendChild(styleElement);
}

function initSearchFunctionality() {
    // Desktop search input
    const desktopSearchInput = document.querySelector('.sm\\:block input[type="text"]');
    if (desktopSearchInput) {
        desktopSearchInput.addEventListener('input', function() {
            searchState.query = this.value;
            performSearch();
        });
        
        // Handle keyboard navigation
        desktopSearchInput.addEventListener('keydown', handleKeyDown);
    }
    
    // Mobile search button
    const mobileSearchButton = document.querySelector('.sm\\:hidden button');
    if (mobileSearchButton) {
        mobileSearchButton.addEventListener('click', toggleMobileSearch);
    }
    
    // Mobile search input
    const mobileSearchInput = document.querySelector('.fixed.inset-0.z-\\[9999\\] input[type="text"]');
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', function() {
            searchState.query = this.value;
            performSearch();
        });
    }
    
    // Mobile search close button
    const mobileCloseButton = document.querySelector('.fixed.inset-0.z-\\[9999\\] button');
    if (mobileCloseButton) {
        mobileCloseButton.addEventListener('click', toggleMobileSearch);
    }
    
    // Clear search buttons
    const clearButtons = document.querySelectorAll('[data-clear-search]');
    clearButtons.forEach(button => {
        button.addEventListener('click', clearSearch);
    });
}

async function performSearch() {
    // Clear any existing timeout
    if (searchState.searchTimeout) {
        clearTimeout(searchState.searchTimeout);
    }
    
    // Set a new timeout for debouncing
    searchState.searchTimeout = setTimeout(async () => {
        if (searchState.query.length < 2) {
            searchState.results = [];
            searchState.showResults = false;
            toggleBlurOverlay(false);
            updateSearchResultsUI();
            return;
        }
        
        searchState.isSearching = true;
        searchState.showResults = true;
        updateLoadingState(true);
        
        try {
            const response = await fetch(`/shop/api/search/?q=${encodeURIComponent(searchState.query)}&limit=5`);
            if (!response.ok) {
                throw new Error(`Search API error: ${response.status}`);
            }
            const data = await response.json();
            
            // Set results and ensure UI updates properly
            if (data.products && data.products.length > 0) {
                // First set the results
                searchState.results = data.products;
                console.log('Search results:', searchState.results);
                
                // Show blur overlay immediately
                toggleBlurOverlay(true);
                
                // Force showResults to be true
                searchState.showResults = true;
                
                // Update the UI with search results
                updateSearchResultsUI();
            } else {
                searchState.results = [];
                toggleBlurOverlay(false);
                updateSearchResultsUI();
            }
            
            // Ensure showResults flag is set correctly
            searchState.showResults = searchState.results.length > 0;
        } catch (error) {
            console.error('Search error:', error);
            searchState.results = [];
            toggleBlurOverlay(false);
            updateSearchResultsUI();
        } finally {
            searchState.isSearching = false;
            updateLoadingState(false);
        }
    }, 300); // 300ms debounce
}

function updateSearchResultsUI() {
    // Update desktop search results
    const desktopResultsContainer = document.getElementById('searchResultsDropdown');
    if (desktopResultsContainer) {
        if (searchState.showResults && searchState.results.length > 0) {
            // Show results container with animation and custom width
            desktopResultsContainer.style.display = 'block';
            desktopResultsContainer.classList.add('search-popup');
            desktopResultsContainer.classList.remove('hidden');
            desktopResultsContainer.style.opacity = '1';
            desktopResultsContainer.style.transform = 'scale(1)';
            desktopResultsContainer.style.zIndex = '50';
            desktopResultsContainer.style.position = 'absolute';
            desktopResultsContainer.style.top = '100%';
            desktopResultsContainer.style.left = '0';
            
            // Apply responsive custom width
            if (window.innerWidth >= 1280) {
                desktopResultsContainer.style.width = '800px';
            } else if (window.innerWidth >= 1024) {
                desktopResultsContainer.style.width = '700px';
            } else if (window.innerWidth >= 768) {
                desktopResultsContainer.style.width = '600px';
            } else if (window.innerWidth >= 640) {
                desktopResultsContainer.style.width = '500px';
            } else {
                desktopResultsContainer.style.width = '400px';
            }
            desktopResultsContainer.style.maxWidth = '90vw';
            desktopResultsContainer.style.minWidth = '400px';
            
            // Update results count
            const resultsCount = desktopResultsContainer.querySelector('.font-bold.text-primary-600');
            if (resultsCount) {
                resultsCount.textContent = searchState.results.length;
            }
            
            // Clear existing results
            const resultsContainer = desktopResultsContainer.querySelector('.space-y-3.max-h-\\[60vh\\]');
            if (resultsContainer) {
                resultsContainer.innerHTML = '';
                
                // Add new results with staggered animation
                searchState.results.forEach((product, index) => {
                    const resultItem = createResultItem(product, index);
                    resultsContainer.appendChild(resultItem);
                });
            }
            
            // Update "View all results" link
            const viewAllLink = desktopResultsContainer.querySelector('a[href*="/shop/search/"]');
            if (viewAllLink) {
                viewAllLink.href = `/shop/search/?q=${encodeURIComponent(searchState.query)}`;
            }
        } else if (searchState.query.length > 1 && searchState.results.length === 0 && !searchState.isSearching) {
            // Show no results message with custom width
            const noResultsContainer = document.querySelector('.absolute.mt-2.w-full.bg-white.rounded-lg.shadow-lg.border.border-gray-200.z-50.p-4.text-center');
            if (noResultsContainer) {
                noResultsContainer.style.display = 'block';
                noResultsContainer.classList.add('search-no-results');
                
                // Apply responsive width to no results container
                if (window.innerWidth >= 1280) {
                    noResultsContainer.style.width = '800px';
                } else if (window.innerWidth >= 1024) {
                    noResultsContainer.style.width = '700px';
                } else if (window.innerWidth >= 768) {
                    noResultsContainer.style.width = '600px';
                } else {
                    noResultsContainer.style.width = '500px';
                }
                noResultsContainer.style.maxWidth = '90vw';
            }
            
            // Hide results container
            desktopResultsContainer.style.display = 'none';
        } else {
            // Hide results container
            desktopResultsContainer.style.display = 'none';
        }
    }
    
    // Update mobile search results
    if (searchState.mobileSearchOpen) {
        const mobileSearchOverlay = document.querySelector('.fixed.inset-0.z-\\[9999\\]');
        const mobileResultsContainer = document.querySelector('.fixed.inset-0.z-\\[9999\\] .grid.grid-cols-1.gap-4');
        
        if (mobileResultsContainer) {
            // Apply full width with padding for mobile
            mobileResultsContainer.style.width = '100%';
            mobileResultsContainer.style.maxWidth = 'none';
            mobileResultsContainer.style.padding = '0 1rem';
            
            // Clear existing results
            mobileResultsContainer.innerHTML = '';
            
            if (searchState.results.length > 0) {
                // Show results container
                mobileResultsContainer.style.display = 'grid';
                
                // Update results count
                const resultsCount = document.querySelector('.fixed.inset-0.z-\\[9999\\] .font-bold.text-primary-600');
                if (resultsCount) {
                    resultsCount.textContent = searchState.results.length;
                }
                
                // Add new results with staggered animation
                searchState.results.forEach((product, index) => {
                    const resultItem = createResultItem(product, index);
                    mobileResultsContainer.appendChild(resultItem);
                });
            } else if (searchState.query.length > 1 && !searchState.isSearching) {
                // Show no results message
                mobileResultsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No products found</p>';
            } else {
                mobileResultsContainer.style.display = 'none';
            }
            
            // Ensure mobile search overlay remains visible
            if (mobileSearchOverlay) {
                mobileSearchOverlay.style.display = 'block';
            }
        }
    }
    
    // Update clear buttons visibility
    updateClearButtonsVisibility();
}

function createResultItem(product, index) {
    const resultItem = document.createElement('a');
    resultItem.href = product.url;
    resultItem.className = 'search-result-item group block hover:bg-gray-50 rounded-lg transition-all duration-200 focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-inset focus:ring-primary-500 overflow-hidden transform hover:scale-[1.02] hover:shadow-md opacity-0';
    resultItem.style.transitionDelay = `${index * 50}ms`;
    resultItem.style.width = '100%';
    resultItem.style.minWidth = '100%';
    
    // Add animation to fade in results one by one
    setTimeout(() => {
        resultItem.style.opacity = '1';
        resultItem.style.transform = 'translateY(0)';
    }, index * 50);
    
    // Format price with PKR currency
    const formattedPrice = window.formatPrice ? window.formatPrice(product.price) : `PKR ${product.price}`;
    
    resultItem.innerHTML = `
        <div class="flex items-start space-x-4 p-4">
            <!-- Enhanced Product Image with Hover Effect -->
            <div class="relative flex-shrink-0 h-24 w-24 bg-gray-100 rounded-lg overflow-hidden shadow-sm border border-gray-200 group-hover:shadow-md transition-all duration-300">
                <img src="${product.image || '/static/images/placeholder.png'}" alt="${product.name}" 
                     class="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                     onerror="this.src='/static/images/placeholder.png'">
                ${product.on_sale ? `
                <div class="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-bl-md transform group-hover:scale-110 transition-transform duration-300">
                    SALE
                </div>` : ''}
            </div>
            
            <!-- Improved Product Details -->
            <div class="flex-1 min-w-0">
                <p class="text-base font-medium text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">${product.name}</p>
                <div class="flex items-center mt-2 space-x-2">
                    ${product.on_sale ? `
                    <div class="flex items-center space-x-2">
                        <span class="text-lg font-bold text-primary-600">${formattedPrice}</span>
                        <span class="text-sm font-semibold text-white bg-red-500 px-2 py-0.5 rounded-full transform group-hover:scale-105 transition-transform duration-300">${product.sale_percentage}%</span>
                    </div>` : `
                    <span class="text-lg font-bold text-primary-600">${formattedPrice}</span>`}
                </div>
                
                <!-- Enhanced Quick View Button -->
                <div class="mt-3 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span class="text-sm text-primary-600 font-medium group-hover:underline">View details</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1 text-primary-600 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
    `;
    
    // Add initial transform for animation
    resultItem.style.transform = 'translateY(10px)';
    
    return resultItem;
}

function updateLoadingState(isLoading) {
    // Update desktop loading spinner
    const desktopSpinner = document.querySelector('.sm\\:block .animate-spin');
    if (desktopSpinner) {
        desktopSpinner.style.display = isLoading ? 'block' : 'none';
    }
    
    // Update mobile loading spinner
    if (searchState.mobileSearchOpen) {
        const mobileSpinner = document.querySelector('.fixed.inset-0.z-\\[9999\\] .animate-spin');
        if (mobileSpinner) {
            mobileSpinner.style.display = isLoading ? 'block' : 'none';
        }
    }
}

function updateClearButtonsVisibility() {
    // Update desktop clear button
    const desktopClearButton = document.querySelector('.sm\\:block button[data-clear-search]');
    if (desktopClearButton) {
        desktopClearButton.style.display = searchState.query.length > 0 ? 'flex' : 'none';
    }
    
    // Update mobile clear button
    if (searchState.mobileSearchOpen) {
        const mobileClearButton = document.querySelector('.fixed.inset-0.z-\\[9999\\] button[data-clear-search]');
        if (mobileClearButton) {
            mobileClearButton.style.display = searchState.query.length > 0 ? 'flex' : 'none';
        }
    }
}

function clearSearch() {
    searchState.query = '';
    searchState.results = [];
    searchState.showResults = false;
    toggleBlurOverlay(false);
    
    // Clear any existing timeout
    if (searchState.searchTimeout) {
        clearTimeout(searchState.searchTimeout);
    }
    
    // Clear desktop search input
    const desktopSearchInput = document.querySelector('.sm\\:block input[type="text"]');
    if (desktopSearchInput) {
        desktopSearchInput.value = '';
    }
    
    // Clear mobile search input
    const mobileSearchInput = document.querySelector('.fixed.inset-0.z-\\[9999\\] input[type="text"]');
    if (mobileSearchInput) {
        mobileSearchInput.value = '';
    }
    
    // Update UI
    updateSearchResultsUI();
}

function toggleBlurOverlay(show) {
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
}

function toggleMobileSearch() {
    // Prevent the mobile menu from opening when search is clicked
    const isOpen = document.querySelector('[x-data="{ isOpen: false, profileOpen: false }"]')?.__x?.getUnobservable().isOpen;
    if (isOpen) {
        // If menu is open, close it first
        document.querySelector('[x-data="{ isOpen: false, profileOpen: false }"]')?.__x?.setUnobservable('isOpen', false);
    }
    
    searchState.mobileSearchOpen = !searchState.mobileSearchOpen;
    
    // Use a more reliable selector for mobile search overlay
    const mobileSearchOverlay = document.querySelector('.fixed.inset-0.z-\\[9999\\]');
    if (mobileSearchOverlay) {
        if (searchState.mobileSearchOpen) {
            // Show mobile search with animation
            mobileSearchOverlay.style.display = 'block';
            mobileSearchOverlay.style.opacity = '1';
            mobileSearchOverlay.style.transform = 'translateY(0)';
            
            // Focus the search input for better UX
            setTimeout(() => {
                const mobileSearchInput = mobileSearchOverlay.querySelector('input[type="text"]');
                if (mobileSearchInput) {
                    mobileSearchInput.focus();
                }
            }, 100);
            
            // If there's a query and results, update the UI
            if (searchState.query.length > 1) {
                performSearch();
            }
        } else {
            // Hide mobile search with animation
            mobileSearchOverlay.style.opacity = '0';
            mobileSearchOverlay.style.transform = 'translateY(10px)';
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                mobileSearchOverlay.style.display = 'none';
            }, 300);
            
            // Hide blur overlay when closing mobile search
            toggleBlurOverlay(false);
        }
    }
}

function isMobileSearchOpen() {
    return searchState.mobileSearchOpen;
}

function hideSearchResults() {
    searchState.showResults = false;
    
    // Hide desktop results
    const desktopResultsContainer = document.getElementById('searchResultsDropdown');
    if (desktopResultsContainer) {
        desktopResultsContainer.style.display = 'none';
    }
    
    // Hide no results message
    const noResultsContainer = document.querySelector('.absolute.mt-2.w-full.bg-white.rounded-lg.shadow-lg.border.border-gray-200.z-50.p-4.text-center');
    if (noResultsContainer) {
        noResultsContainer.style.display = 'none';
    }
}

function handleKeyDown(event) {
    // Handle Enter key to navigate to search results page
    if (event.key === 'Enter' && searchState.query.length > 1) {
        window.location.href = `/shop/search/?q=${encodeURIComponent(searchState.query)}`;
    }
    
    // Handle Escape key to close search results
    if (event.key === 'Escape') {
        hideSearchResults();
        toggleBlurOverlay(false);
    }
}

// Utility function to handle window resize and update search container width
function handleWindowResize() {
    if (searchState.showResults) {
        updateSearchResultsUI();
    }
}

// Add resize event listener
window.addEventListener('resize', handleWindowResize);