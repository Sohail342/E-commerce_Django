document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('productSearch');
    const searchContainer = searchInput?.parentElement;
    const noResultsMessage = document.createElement('div');
    const searchClearButton = document.createElement('button');
    const searchResultsContainer = document.createElement('div');
    let searchTimeout = null;
    let currentSearchTerm = '';
    
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
    
    // If no products found initially, try again after a short delay
    if (!productItemsFound) {
        setTimeout(() => {
            productItemsFound = addProductItemClass();
            // Setup search functionality
            setupSearch();
        }, 300);
    } else {
        // Setup search functionality if products were found immediately
        setupSearch();
    }
    
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
    
    // Function to fetch products from API
    async function fetchProducts(query, minPrice = null, maxPrice = null) {
        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (minPrice) params.append('min_price', minPrice);
            if (maxPrice) params.append('max_price', maxPrice);
            
            const response = await fetch(`/shop/api/search?${params.toString()}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error fetching products:', error);
            return { products: [], count: 0 };
        }
    }
    
    // Function to render search results
    function renderSearchResults(results) {
        if (!searchResultsContainer) return;
        
        // Clear previous results
        searchResultsContainer.innerHTML = '';
        
        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'p-4 text-center text-gray-500';
            noResults.textContent = 'No products found';
            searchResultsContainer.appendChild(noResults);
            return;
        }
        
        // Create results list
        const resultsList = document.createElement('ul');
        resultsList.className = 'divide-y divide-gray-100';
        
        results.forEach(product => {
            const item = document.createElement('li');
            item.className = 'hover:bg-gray-50 transition-colors duration-150';
            
            const link = document.createElement('a');
            link.href = product.url;
            link.className = 'flex items-center p-3 group';
            
            // Product image
            const imgContainer = document.createElement('div');
            imgContainer.className = 'w-12 h-12 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden mr-3';
            
            if (product.image_url) {
                const img = document.createElement('img');
                img.src = product.image_url;
                img.alt = product.name;
                img.className = 'w-full h-full object-contain group-hover:scale-110 transition-transform duration-300';
                imgContainer.appendChild(img);
            } else {
                // Placeholder if no image
                imgContainer.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center text-gray-400">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                    </div>
                `;
            }
            
            // Product details
            const details = document.createElement('div');
            details.className = 'flex-grow';
            
            const name = document.createElement('div');
            name.className = 'text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors';
            name.textContent = product.name;
            
            const price = document.createElement('div');
            price.className = 'text-sm text-gray-600';
            price.textContent = `PKR ${product.price}`;
            
            details.appendChild(name);
            details.appendChild(price);
            
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
    
    // Function to handle search
    async function handleSearch() {
        const searchTerm = searchInput.value.trim();
        const minPrice = document.getElementById('minPrice')?.value;
        const maxPrice = document.getElementById('maxPrice')?.value;
        
        // Show search status
        const searchStatus = document.getElementById('searchStatus');
        if (searchStatus) {
            if (searchTerm.length > 0) {
                searchStatus.classList.remove('hidden');
                searchStatus.textContent = `Searching for "${searchTerm}"...`;
            } else {
                searchStatus.classList.add('hidden');
            }
        }
        
        // Show loading indicator and hide search icon
        searchIcon.classList.add('opacity-0');
        loadingIndicator.classList.remove('hidden');
        
        // Show clear button if there's text
        if (searchTerm.length > 0) {
            searchClearButton.classList.remove('hidden');
            searchContainer.classList.add('bg-white', 'shadow-md');
            searchContainer.classList.remove('bg-gray-50', 'shadow-sm');
        } else {
            searchClearButton.classList.add('hidden');
            searchContainer.classList.remove('bg-white', 'shadow-md');
            searchContainer.classList.add('bg-gray-50', 'shadow-sm');
        }
        
        // If search term is empty, hide results and reset UI
        if (searchTerm.length === 0) {
            searchResultsContainer.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            loadingIndicator.classList.add('hidden');
            searchIcon.classList.remove('opacity-0');
            
            // Show all products in the grid
            const productItems = document.querySelectorAll('.product-item');
            productItems.forEach(item => {
                item.classList.remove('hidden', 'opacity-0');
                item.classList.add('opacity-100');
            });
            
            noResultsMessage.classList.add('hidden');
            return;
        }
        
        try {
            // Fetch products from API
            const data = await fetchProducts(searchTerm, minPrice, maxPrice);
            
            // Update search status
            if (searchStatus) {
                searchStatus.textContent = `Found ${data.count} product(s) matching "${searchTerm}"`;
            }
            
            // Render results in dropdown
            renderSearchResults(data.products);
            
            // Show dropdown with animation
            if (data.products.length > 0) {
                searchResultsContainer.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
                searchResultsContainer.classList.add('opacity-100', 'scale-100');
            } else {
                searchResultsContainer.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                noResultsMessage.classList.remove('hidden');
                noResultsMessage.textContent = `No products found matching "${searchTerm}"`;
            }
            
            // Update product grid if we're on the shop or category page
            const productGrid = document.querySelector('.grid.grid-cols-2');
            if (productGrid) {
                const productItems = document.querySelectorAll('.product-item');
                
                // If no search results, show message in grid
                if (data.products.length === 0) {
                    productItems.forEach(item => {
                        item.classList.add('opacity-0');
                        setTimeout(() => {
                            item.classList.add('hidden');
                        }, 200);
                    });
                } else {
                    // Filter grid items based on search results
                    const productIds = data.products.map(p => p.id);
                    
                    productItems.forEach(item => {
                        // Try to extract product ID from the item
                        const link = item.querySelector('a[href*="/product/"]');
                        if (!link) return;
                        
                        const href = link.getAttribute('href');
                        const idMatch = href.match(/\/product\/([0-9]+)/);
                        if (!idMatch) return;
                        
                        const productId = parseInt(idMatch[1]);
                        const isVisible = productIds.includes(productId);
                        
                        // Apply transition for smooth filtering
                        if (isVisible) {
                            item.classList.remove('hidden');
                            item.classList.remove('opacity-0');
                            item.classList.add('opacity-100');
                        } else {
                            item.classList.add('opacity-0');
                            setTimeout(() => {
                                item.classList.add('hidden');
                            }, 200);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            // Hide loading indicator and show search icon again
            loadingIndicator.classList.add('hidden');
            searchIcon.classList.remove('opacity-0');
        }
    }
    
    // Debounce function to limit how often handleSearch runs
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
    
    // Setup search functionality
    function setupSearch() {
        // Add transition styles to product items
        const productItems = document.querySelectorAll('.product-item');
        productItems.forEach(item => {
            item.style.transition = 'opacity 300ms ease-in-out, transform 300ms ease-in-out';
        });
        
        // Create debounced search function
        const debouncedSearch = debounce(handleSearch, 300);
        
        // Add event listeners
        searchInput.addEventListener('input', debouncedSearch);
        searchInput.addEventListener('keyup', function(e) {
            // Immediate search on Enter key
            if (e.key === 'Enter') {
                if (searchTimeout) clearTimeout(searchTimeout);
                handleSearch();
            }
            
            // Close dropdown on Escape key
            if (e.key === 'Escape') {
                searchResultsContainer.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            }
        });
        
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
                debouncedSearch();
            });
            
            maxPriceSlider.addEventListener('input', function() {
                if (maxPriceValue) maxPriceValue.textContent = this.value;
                if (parseInt(this.value) < parseInt(minPriceSlider.value)) {
                    minPriceSlider.value = this.value;
                    if (minPriceValue) minPriceValue.textContent = this.value;
                }
                debouncedSearch();
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