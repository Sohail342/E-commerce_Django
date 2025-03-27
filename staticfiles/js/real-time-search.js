document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('productSearch');
    const searchContainer = searchInput?.parentElement;
    const noResultsMessage = document.createElement('div');
    const searchClearButton = document.createElement('button');
    
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
            // Run initial filter to ensure everything is set up
            filterProducts();
        }, 300);
    } else {
        // Run initial filter if products were found immediately
        filterProducts();
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
    
    // Function to filter products
    function filterProducts() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const productItems = document.querySelectorAll('.product-item');
        let visibleCount = 0;
        
        // Show search status
        const searchStatus = document.getElementById('searchStatus');
        if (searchStatus && searchTerm.length > 0) {
            searchStatus.classList.remove('hidden');
            searchStatus.textContent = `Searching for "${searchTerm}"...`;
        } else if (searchStatus) {
            searchStatus.classList.add('hidden');
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
        
        // Log for debugging
        console.log(`Filtering ${productItems.length} products with search term: "${searchTerm}"`);
        
        // Small delay to simulate processing and show loading indicator
        setTimeout(() => {
            productItems.forEach(item => {
                const productName = item.querySelector('h3')?.textContent.toLowerCase() || '';
                const productDetails = item.textContent.toLowerCase(); // Search in all text content
                const isVisible = searchTerm === '' || productName.includes(searchTerm) || productDetails.includes(searchTerm);
                
                // Apply transition for smooth filtering
                if (isVisible) {
                    item.classList.remove('hidden');
                    item.classList.remove('opacity-0');
                    item.classList.add('opacity-100');
                    visibleCount++;
                } else {
                    item.classList.add('opacity-0');
                    setTimeout(() => {
                        item.classList.add('hidden');
                    }, 200); // Faster transition
                }
            });
            
            // Show/hide no results message
            if (visibleCount === 0 && searchTerm.length > 0) {
                noResultsMessage.classList.remove('hidden');
                noResultsMessage.textContent = `No products found matching "${searchTerm}"`;
            } else {
                noResultsMessage.classList.add('hidden');
            }
            
            // Update search status
            if (searchStatus && searchTerm.length > 0) {
                searchStatus.textContent = `Found ${visibleCount} product(s) matching "${searchTerm}"`;
            }
            
            // Hide loading indicator and show search icon again
            loadingIndicator.classList.add('hidden');
            searchIcon.classList.remove('opacity-0');
            
            // Log results for debugging
            console.log(`Search complete: ${visibleCount} products visible`);
        }, 200); // Faster response time
    }
    
    // Debounce function to limit how often filterProducts runs
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
    
    // Add event listeners
    const debouncedFilter = debounce(filterProducts, 200); // Faster debounce time
    searchInput.addEventListener('input', debouncedFilter);
    searchInput.addEventListener('keyup', function(e) {
        // Immediate search on Enter key
        if (e.key === 'Enter') {
            clearTimeout(debouncedFilter.timeout);
            filterProducts();
        }
    });
    
    // Clear search functionality
    searchClearButton.addEventListener('click', function() {
        searchInput.value = '';
        filterProducts(); // Reset the filter
        searchInput.focus();
    });
    
    // Add transition styles to product items
    productItems.forEach(item => {
        item.style.transition = 'opacity 300ms ease-in-out, transform 300ms ease-in-out';
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
    });
    
    searchInput.addEventListener('blur', function() {
        if (this.value.trim() === '') {
            this.parentElement.classList.remove('ring-2', 'ring-primary-500', 'border-transparent', 'bg-white', 'shadow-md');
            this.parentElement.classList.add('bg-gray-50', 'shadow-sm');
        } else {
            this.parentElement.classList.remove('ring-2', 'ring-primary-500');
        }
    });
    
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
});