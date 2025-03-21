// Product Listing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const productSearch = document.getElementById('productSearch');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const minPriceValue = document.getElementById('minPriceValue');
    const maxPriceValue = document.getElementById('maxPriceValue');
    const productGrid = document.querySelector('.product-grid');
    const searchContainer = document.querySelector('.search-container');
    let searchTimeout = null;
    
    // Add clear search button and results counter
    const clearSearchButton = document.createElement('button');
    clearSearchButton.className = 'clear-search';
    clearSearchButton.innerHTML = '×';
    clearSearchButton.style.display = 'none';
    searchContainer.appendChild(clearSearchButton);
    
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchContainer.appendChild(searchResults);

    // Search functionality
    function fetchProducts() {
        const searchTerm = productSearch.value;
        const minPrice = minPriceInput.value;
        const maxPrice = maxPriceInput.value;

        const url = `/shop/api/search?q=${encodeURIComponent(searchTerm)}&min_price=${minPrice}&max_price=${maxPrice}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                productGrid.innerHTML = '';
                searchResults.textContent = `${data.count} products found`;

                data.products.forEach(product => {
                    const card = document.createElement('div');
                    card.className = 'product-card';
                    card.innerHTML = `
                        <div class="product-image">
                            <img src="${product.image_url || '/static/images/no-image.png'}" alt="${product.name}">
                        </div>
                        <div class="product-info">
                            <a href="${product.url}" class="product-name">${product.name}</a>
                            <div class="product-price">${product.price}</div>
                            <div class="product-actions">
                                <a href="${product.url}" class="action-button">View Details</a>
                            </div>
                        </div>
                    `;
                    productGrid.appendChild(card);
                    
                    // Animate card appearance
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                });
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                searchResults.textContent = 'Error loading products';
            });
    }

    function debounceSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(fetchProducts, 300);
    }

        // Update search results count and clear button visibility
        searchResults.textContent = `${visibleCount} products found`;
        clearSearchButton.style.display = searchTerm ? 'block' : 'none';
    }

    // Event listeners for search and price range
    productSearch.addEventListener('input', debounceSearch);
    clearSearchButton.addEventListener('click', () => {
        productSearch.value = '';
        debounceSearch();
    });
    
    minPriceInput.addEventListener('input', function() {
        minPriceValue.textContent = this.value;
        debounceSearch();
    });
    
    maxPriceInput.addEventListener('input', function() {
        maxPriceValue.textContent = this.value;
        debounceSearch();
    });

    // Initialize price range values
    minPriceValue.textContent = minPriceInput.value;
    maxPriceValue.textContent = maxPriceInput.value;

    // Initial load
    fetchProducts();
});
    // Initial filter to show total count
    filterProducts();
});