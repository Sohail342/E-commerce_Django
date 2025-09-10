/**
 * Real-time search functionality for shop and category pages
 * This script handles filtering products based on search input
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get search input element
    const searchInput = document.getElementById('productSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    const searchStatus = document.getElementById('searchStatus');
    const productItems = document.querySelectorAll('.product-item');
    
    // Debounce function to limit how often the search is performed
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
    
    // Function to handle the search
    window.handleSearch = function() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const minPrice = parseInt(document.getElementById('minPrice')?.value || 0);
        const maxPrice = parseInt(document.getElementById('maxPrice')?.value || 10000);
        
        // Show/hide clear button based on search term
        if (clearSearchBtn) {
            if (searchTerm.length > 0) {
                clearSearchBtn.classList.remove('hidden');
            } else {
                clearSearchBtn.classList.add('hidden');
            }
        }
        
        // Show search status indicator
        if (searchStatus) {
            searchStatus.classList.remove('hidden');
            setTimeout(() => {
                searchStatus.classList.add('hidden');
            }, 800); // Hide after 800ms
        }
        
        // Filter products based on search term and price range
        let matchCount = 0;
        
        productItems.forEach(item => {
            // Get product details
            const productName = item.querySelector('h3 a')?.textContent.toLowerCase() || '';
            
            // Get price (handle both regular and sale prices)
            let priceText = item.querySelector('.text-primary-800')?.textContent || '';
            priceText = priceText.replace(/[^0-9.]/g, ''); // Remove non-numeric characters
            const price = parseFloat(priceText) || 0;
            
            // Check if product matches search criteria
            const matchesSearch = searchTerm === '' || productName.includes(searchTerm);
            const matchesPrice = price >= minPrice && price <= maxPrice;
            
            // Show/hide product based on matches
            if (matchesSearch && matchesPrice) {
                item.classList.remove('hidden');
                // Add a slight delay for a staggered animation effect
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, matchCount * 50); // Stagger effect
                matchCount++;
            } else {
                item.style.opacity = '0';
                item.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    item.classList.add('hidden');
                }, 300); // Match the transition duration
            }
        });
        
        // Show no results message if needed
        const noResultsEl = document.querySelector('.no-results');
        if (noResultsEl) {
            if (matchCount === 0) {
                noResultsEl.classList.remove('hidden');
            } else {
                noResultsEl.classList.add('hidden');
            }
        }
    };
    
    // Add event listener to search input with debounce
    if (searchInput) {
        searchInput.addEventListener('input', debounce(window.handleSearch, 300));
        
        // Add event listener for Enter key
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission
                window.handleSearch();
            }
        });
    }
    
    // Add event listener to clear search button
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearSearchBtn.classList.add('hidden');
            window.handleSearch();
            searchInput.focus();
        });
    }
    
    // Initialize search on page load
    window.handleSearch();
});