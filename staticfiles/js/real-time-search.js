document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('productSearch');
    const searchContainer = searchInput?.parentElement;
    const noResultsMessage = document.createElement('div');
    const searchClearButton = document.createElement('button');
    const searchResultsContainer = document.createElement('div');
    let searchTimeout = null;
    let currentSearchTerm = '';
    let lastSearchResults = [];
    let isSearching = false;
    
    // Skip if search input doesn't exist
    if (!searchInput) return;
    
    // Try multiple selectors to find product items based on the actual HTML structure
    function addProductItemClass() {
        // First try with the most specific selector from the HTML
        let items = document.querySelectorAll('.group.bg-white.rounded-lg.shadow-sm.hover\\:shadow-lg.overflow-hidden');
        
        // If no items found, try with a less specific selector
        if (items.length === 0) {
            items = document.querySelectorAll('.group.bg-white.rounded-lg.shadow-sm');
        }
        
        // If still no items found, try with an even less specific selector
        if (items.length === 0) {
            items = document.querySelectorAll('.group.bg-white');
        }
        
        // Add the product-item class to all found items
        items.forEach(item => {
            item.classList.add('product-item');
        });
        
        return items.length > 0;
    }
    
    // Try to add class immediately
    let productItemsFound = addProductItemClass();
    
    // Always set up search after DOM is fully loaded
    // This ensures the search functionality is properly initialized
    setTimeout(() => {
        // Try again to find product items if not found initially
        if (!productItemsFound) {
            productItemsFound = addProductItemClass();
        }
        // Setup search functionality
        setupSearch();
    }, 300);
    
    // Enhance search field UI
    if (searchInput && searchContainer) {
        searchInput.classList.add('pl-10', 'pr-10', 'focus:shadow-lg');
        searchContainer.classList.add('transition-all', 'duration-300');
    }
    
    // Setup no results message
    noResultsMessage.className = 'col-span-full text-center py-8 text-gray-500 hidden';
    noResultsMessage.textContent = 'No products found matching your search';
    noResultsMessage.id = 'noResultsMessage';
    
    // Add no results message to the product grid
    const productGrid = document.querySelector('.grid.grid-cols-2');
    if (productGrid) {
        productGrid.appendChild(noResultsMessage);
    }
    
    // Setup clear button
    searchClearButton.className = 'absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors hidden cursor-pointer';
    searchClearButton.id = 'searchClearButton';
    searchClearButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
    `;
    searchClearButton.type = 'button';
    searchClearButton.setAttribute('aria-label', 'Clear search');
    
    // Add clear button to search container
    if (searchContainer) {
        searchContainer.appendChild(searchClearButton);
        // Make search container relative if it's not already
        if (window.getComputedStyle(searchContainer).position !== 'relative') {
            searchContainer.style.position = 'relative';
        }
    }
    
    // Add search icon to the left side
    const searchIcon = document.createElement('div');
    searchIcon.className = 'absolute left-3 top-2.5 h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors duration-300';
    searchIcon.id = 'searchIcon';
    searchIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
    `;
    
    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'absolute right-10 top-2.5 h-5 w-5 text-primary-500 hidden';
    loadingIndicator.id = 'searchLoadingIndicator';
    loadingIndicator.innerHTML = `
        <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    `;
    
    if (searchContainer) {
        // Remove existing search icon from the HTML
        const existingSvg = searchContainer.querySelector('svg');
        if (existingSvg) {
            existingSvg.remove();
        }
        
        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(loadingIndicator);
    }
    
    // Setup search results dropdown
    searchResultsContainer.className = 'absolute z-50 left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden transform transition-all duration-300 scale-95 opacity-0 pointer-events-none';
    searchResultsContainer.id = 'searchResultsDropdown';
    searchResultsContainer.style.maxHeight = '400px';
    searchResultsContainer.style.overflowY = 'auto';
    
    if (searchContainer) {
        searchContainer.style.position = 'relative';
        searchContainer.appendChild(searchResultsContainer);
    }
    
    // Create a cache for search results to improve performance
    const searchCache = new Map();
    
    // Enhanced function to fetch products from API with better error handling and performance
    async function fetchProducts(query, minPrice = null, maxPrice = null) {
        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (minPrice) params.append('min_price', minPrice);
            if (maxPrice) params.append('max_price', maxPrice);
            
            // Get category ID if we're on a category page
            const categoryMatch = window.location.pathname.match(/\/category\/([^/]+)/);
            if (categoryMatch && categoryMatch[1]) {
                // We're on a category page, but we don't have the ID directly
                // The API will handle filtering by name if needed
                params.append('category_name', categoryMatch[1]);
            }
            
            // Create a cache key based on the search parameters
            const cacheKey = params.toString();
            
            // Check if we have a cached result for this query
            if (searchCache.has(cacheKey)) {
                console.log('Using cached search results');
                return searchCache.get(cacheKey);
            }
            
            // Adaptive timeout based on network conditions
            let timeoutDuration = 8000; // Default 8 seconds
            
            // Adjust timeout based on network conditions if available
            if (navigator.connection) {
                const connectionType = navigator.connection.effectiveType;
                // Adjust timeout based on connection quality
                if (connectionType === '4g') {
                    timeoutDuration = 5000; // 5 seconds for fast connections
                } else if (connectionType === '3g') {
                    timeoutDuration = 10000; // 10 seconds for medium connections
                } else if (connectionType === '2g' || connectionType === 'slow-2g') {
                    timeoutDuration = 15000; // 15 seconds for slow connections
                }
                console.log(`Network type: ${connectionType}, timeout: ${timeoutDuration}ms`);
            }
            
            // Add a timeout to the fetch request to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
            
            // Add request timestamp for performance tracking
            const requestStartTime = performance.now();
            
            const response = await fetch(`/shop/api/search?${params.toString()}`, {
                signal: controller.signal,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            // Calculate request duration for performance monitoring
            const requestDuration = performance.now() - requestStartTime;
            console.log(`Search request completed in ${requestDuration.toFixed(2)}ms`);
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText || response.statusText}`);
            }
            
            const data = await response.json();
            
            // Validate the response data structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format from server');
            }
            
            // Cache the results (limit cache size to prevent memory issues)
            if (searchCache.size > 20) {
                // Remove oldest entry if cache gets too large
                const firstKey = searchCache.keys().next().value;
                searchCache.delete(firstKey);
            }
            searchCache.set(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error('Error fetching products:', error);
            
            // Enhanced error handling with more specific messages
            if (error.name === 'AbortError') {
                // Request was aborted (timeout)
                console.warn('Search request timed out');
                return { 
                    products: [], 
                    count: 0, 
                    error: 'Search request timed out. The server is taking too long to respond. Please try again later.'
                };
            } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                // Network error
                return { 
                    products: [], 
                    count: 0, 
                    error: 'Network connection error. Please check your internet connection and try again.'
                };
            } else if (error.message.includes('Server error')) {
                // Server returned an error status
                return { 
                    products: [], 
                    count: 0, 
                    error: error.message
                };
            } else if (error.message.includes('Invalid response format')) {
                // Invalid JSON or unexpected response format
                return { 
                    products: [], 
                    count: 0, 
                    error: 'The server returned an invalid response. Please try again later.'
                };
            } else {
                // Other unexpected errors
                return { 
                    products: [], 
                    count: 0, 
                    error: 'An unexpected error occurred while searching. Please try again later.'
                };
            }
        }
        }
    }
    
    // Enhanced function to render search results with better visual feedback
    function renderSearchResults(results, errorMessage = null) {
        if (!searchResultsContainer) return;
        
        // Clear previous results with a smooth fade-out effect
        searchResultsContainer.classList.add('search-results-exit-active');
        
        // Use setTimeout to wait for animation to complete before updating content
        setTimeout(() => {
            searchResultsContainer.innerHTML = '';
            searchResultsContainer.classList.remove('search-results-exit-active');
            searchResultsContainer.classList.add('search-results-enter');
            
            // Handle error state with improved visual feedback
            if (errorMessage) {
                const errorContainer = document.createElement('div');
                errorContainer.className = 'p-6 text-center';
                errorContainer.innerHTML = `
                    <svg class="w-12 h-12 mx-auto text-red-400 mb-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <p class="text-red-500 font-medium">Search Error</p>
                    <p class="text-sm text-gray-600 mt-1">${errorMessage}</p>
                    <button class="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm focus:ring-2 focus:ring-primary-300 focus:ring-offset-2" id="retrySearch">Try Again</button>
                `;
                searchResultsContainer.appendChild(errorContainer);
                
                // Add retry button functionality with improved feedback
                const retryButton = document.getElementById('retrySearch');
                if (retryButton) {
                    retryButton.addEventListener('click', () => {
                        retryButton.innerHTML = `
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Retrying...
                        `;
                        retryButton.disabled = true;
                        setTimeout(() => handleSearch(), 300); // Small delay for better UX
                    });
                }
                
                // Complete the animation
                setTimeout(() => {
                    searchResultsContainer.classList.remove('search-results-enter');
                    searchResultsContainer.classList.add('search-results-enter-active');
                }, 10);
                
                return;
            }
            
            // Handle empty results with improved visual feedback
            if (!results || results.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'p-6 text-center';
                noResults.innerHTML = `
                    <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="text-gray-500">No products found</p>
                    <p class="text-xs text-gray-400 mt-1">Try a different search term</p>
                    <p class="text-xs text-gray-400 mt-3">Suggestions:</p>
                    <ul class="text-xs text-gray-500 mt-1 space-y-1">
                        <li>• Check for spelling errors</li>
                        <li>• Try more general keywords</li>
                        <li>• Try different keywords</li>
                    </ul>
                `;
                searchResultsContainer.appendChild(noResults);
                
                // Complete the animation
                setTimeout(() => {
                    searchResultsContainer.classList.remove('search-results-enter');
                    searchResultsContainer.classList.add('search-results-enter-active');
                }, 10);
                
                return;
            }
        
        // Create results list with improved styling
        const resultsList = document.createElement('ul');
        resultsList.className = 'divide-y divide-gray-100';
        
        // Add header with result count
        const header = document.createElement('div');
        header.className = 'px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 sticky top-0 z-10';
        header.textContent = `${results.length} product${results.length !== 1 ? 's' : ''} found`;
        searchResultsContainer.appendChild(header);
        
        results.forEach(product => {
            const item = document.createElement('li');
            item.className = 'hover:bg-gray-50 transition-all duration-200';
            
            const link = document.createElement('a');
            link.href = product.url;
            link.className = 'flex items-center p-3 group';
            
            // Product image with improved styling
            const imgContainer = document.createElement('div');
            imgContainer.className = 'w-14 h-14 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden mr-3 border border-gray-200 p-1';
            
            if (product.image_url) {
                const img = document.createElement('img');
                img.src = product.image_url;
                img.alt = product.name;
                img.className = 'w-full h-full object-contain group-hover:scale-110 transition-transform duration-300';
                img.loading = 'lazy'; // Lazy load images for better performance
                imgContainer.appendChild(img);
            } else {
                // Improved placeholder if no image
                imgContainer.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center text-gray-400">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                    </div>
                `;
            }
            
            // Product details with improved styling
            const details = document.createElement('div');
            details.className = 'flex-grow';
            
            const name = document.createElement('div');
            name.className = 'text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1';
            name.textContent = product.name;
            
            // Price display with sale price if available
            const priceContainer = document.createElement('div');
            priceContainer.className = 'flex items-center gap-2 mt-0.5';
            
            if (product.on_sale && product.sale_price) {
                const originalPrice = document.createElement('span');
                originalPrice.className = 'text-xs text-gray-500 line-through';
                originalPrice.textContent = `PKR ${product.price}`;
                
                const salePrice = document.createElement('span');
                salePrice.className = 'text-sm font-medium text-red-600';
                salePrice.textContent = `PKR ${product.sale_price}`;
                
                priceContainer.appendChild(salePrice);
                priceContainer.appendChild(originalPrice);
            } else {
                const price = document.createElement('span');
                price.className = 'text-sm text-gray-600';
                price.textContent = `PKR ${product.price}`;
                priceContainer.appendChild(price);
            }
            
            details.appendChild(name);
            details.appendChild(priceContainer);
            
            // Add badges for trending or on sale
            if (product.trending || product.on_sale) {
                const badgeContainer = document.createElement('div');
                badgeContainer.className = 'flex gap-1 mt-1';
                
                if (product.trending) {
                    const trendingBadge = document.createElement('span');
                    trendingBadge.className = 'px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium flex items-center';
                    trendingBadge.innerHTML = `
                        <svg class="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/>
                        </svg>
                        Hot
                    `;
                    badgeContainer.appendChild(trendingBadge);
                }
                
                if (product.on_sale) {
                    const saleBadge = document.createElement('span');
                    saleBadge.className = 'px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium';
                    saleBadge.textContent = 'Sale';
                    badgeContainer.appendChild(saleBadge);
                }
                
                details.appendChild(badgeContainer);
            }
            
            // Arrow icon
            const arrow = document.createElement('div');
            arrow.className = 'text-gray-400 group-hover:text-primary-500 transform group-hover:translate-x-1 transition-all duration-200';
            arrow.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            `;
            
            link.appendChild(imgContainer);
            link.appendChild(details);
            link.appendChild(arrow);
            item.appendChild(link);
            resultsList.appendChild(item);
        });
        
        searchResultsContainer.appendChild(resultsList);
    }
    
    // Enhanced function to handle search with better user feedback
    // Expose the function to the global scope so it can be called from filter-sidebar.js
    window.handleSearch = async function() {
        const searchTerm = searchInput.value.trim();
        const minPrice = document.getElementById('minPrice')?.value;
        const maxPrice = document.getElementById('maxPrice')?.value;
        
        // Track search performance
        const searchStartTime = performance.now();
        
        // Don't search again if the term hasn't changed and we're not forcing a refresh
        if (searchTerm === currentSearchTerm && isSearching) {
            return;
        }
        
        // Track previous search term for comparison
        const previousSearchTerm = currentSearchTerm;
        currentSearchTerm = searchTerm;
        isSearching = true;
        
        // Show search status with typing animation and improved feedback
        const searchStatus = document.getElementById('searchStatus');
        if (searchStatus) {
            if (searchTerm.length > 0) {
                searchStatus.classList.remove('hidden');
                // Show different message based on search term length for better UX
                if (searchTerm.length < 3) {
                    searchStatus.innerHTML = `<span class="inline-block text-amber-600">Type at least 3 characters for better results</span>`;
                } else {
                    searchStatus.innerHTML = `<span class="inline-block animate-pulse">Searching for "${searchTerm}"...</span>`;
                }
            } else {
                searchStatus.classList.add('hidden');
            }
        }
        
        // Enhanced loading indicator with animation
        searchIcon.classList.add('opacity-0');
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.classList.add('animate-spin');
        
        // Improved visual feedback when search is active
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const searchTerm = searchInput.value.trim();
                const minPrice = document.getElementById('minPrice')?.value;
                const maxPrice = document.getElementById('maxPrice')?.value;
                const data = await fetchProducts(searchTerm, minPrice, maxPrice);
                renderSearchResults(data.products);
            }, 300);
        });
        
        // Add event listeners for price range inputs
        const minPriceInput = document.getElementById('minPrice');
        const maxPriceInput = document.getElementById('maxPrice');
        
        [minPriceInput, maxPriceInput].forEach(input => {
            input?.addEventListener('change', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(async () => {
                    const searchTerm = searchInput.value.trim();
                    const minPrice = minPriceInput.value;
                    const maxPrice = maxPriceInput.value;
                    const data = await fetchProducts(searchTerm, minPrice, maxPrice);
                    renderSearchResults(data.products);
                }, 300);
            });
        });
        
        // Close dropdown on Escape key
        if (e.key === 'Escape') {
            searchResultsContainer.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
        }
        }
        
        // Clear search functionality
        searchClearButton.addEventListener('click', function() {
            searchInput.value = '';
            handleSearch(); // Reset the search
            searchInput.focus();
            searchResultsContainer.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchContainer.contains(e.target)) {
                searchResultsContainer.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            }
        });
        
        // Add focus styles to search input
        searchInput.addEventListener('focus', function() {
            this.parentElement.classList.add('ring-2', 'ring-primary-500', 'border-transparent', 'bg-white', 'shadow-md');
            this.parentElement.classList.remove('bg-gray-50', 'shadow-sm');
            // Add a subtle animation
            this.parentElement.style.transform = 'scale(1.01)';
            setTimeout(() => {
                this.parentElement.style.transform = 'scale(1)';
            }, 200);
            
            // Show dropdown if there are results and search term is not empty
            if (searchInput.value.trim().length > 0 && searchResultsContainer.children.length > 0) {
                searchResultsContainer.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
                searchResultsContainer.classList.add('opacity-100', 'scale-100');
            }
        });
        
        searchInput.addEventListener('blur', function(e) {
            // Don't hide the dropdown if clicking inside it
            if (e.relatedTarget && searchResultsContainer.contains(e.relatedTarget)) {
                return;
            }
            
            if (this.value.trim() === '') {
                this.parentElement.classList.remove('ring-2', 'ring-primary-500', 'border-transparent', 'bg-white', 'shadow-md');
                this.parentElement.classList.add('bg-gray-50', 'shadow-sm');
            } else {
                this.parentElement.classList.remove('ring-2', 'ring-primary-500');
            }
        });
        
        // Price range filters
        const minPriceSlider = document.getElementById('minPrice');
        const maxPriceSlider = document.getElementById('maxPrice');
        const minPriceValue = document.getElementById('minPriceValue');
        const maxPriceValue = document.getElementById('maxPriceValue');
        
        if (minPriceSlider && maxPriceSlider) {
            // Update price display and trigger search on slider change
            minPriceSlider.addEventListener('input', function() {
                if (minPriceValue) minPriceValue.textContent = this.value;
                if (parseInt(this.value) > parseInt(maxPriceSlider.value)) {
                    maxPriceSlider.value = this.value;
                    if (maxPriceValue) maxPriceValue.textContent = this.value;
                }
                // Ensure search is performed with current price range values
                debouncedSearch();
            });
            
            minPriceSlider.addEventListener('change', function() {
                // Also trigger search on slider release for better UX
                handleSearch();
            });
            
            maxPriceSlider.addEventListener('input', function() {
                if (maxPriceValue) maxPriceValue.textContent = this.value;
                if (parseInt(this.value) < parseInt(minPriceSlider.value)) {
                    minPriceSlider.value = this.value;
                    if (minPriceValue) minPriceValue.textContent = this.value;
                }
                // Ensure search is performed with current price range values
                debouncedSearch();
            });
            
            maxPriceSlider.addEventListener('change', function() {
                // Also trigger search on slider release for better UX
                handleSearch();
            });
        }
    }
    
    // Mobile responsiveness improvements
    function adjustSearchFieldForMobile() {
        if (window.innerWidth < 768) { // Mobile view
            searchInput.placeholder = 'Search...';
        } else {
            searchInput.placeholder = 'Search products...';
        }
    }
    
    // Run on load and on resize
    adjustSearchFieldForMobile();
    window.addEventListener('resize', adjustSearchFieldForMobile);
    
    // Initial search setup
    document.addEventListener('DOMContentLoaded', function() {
        // Run initial search if URL has search parameter
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q');
        if (searchQuery && searchInput) {
            searchInput.value = searchQuery;
            handleSearch();
        }
    });
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.2); }
            70% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
            100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        
        #searchResultsDropdown {
            transition: opacity 0.2s ease, transform 0.2s ease;
        }
        
        #searchResultsDropdown.opacity-100 {
            animation: fadeIn 0.3s ease-out;
        }
        
        #productSearch:focus {
            animation: pulse 2s infinite;
        }
    `;
    document.head.appendChild(style);
});