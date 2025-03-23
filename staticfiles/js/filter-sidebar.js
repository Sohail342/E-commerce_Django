document.addEventListener('DOMContentLoaded', function() {
    const filterToggle = document.getElementById('filterToggle');
    const filterSidebar = document.getElementById('filterSidebar');
    const closeFilter = document.getElementById('closeFilter');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const minPriceValue = document.getElementById('minPriceValue');
    const maxPriceValue = document.getElementById('maxPriceValue');

    // Toggle filter sidebar
    function toggleSidebar() {
        const isHidden = filterSidebar.classList.contains('-translate-x-full');
        filterSidebar.classList.toggle('-translate-x-full');
        filterSidebar.classList.toggle('pointer-events-none');
        filterSidebar.classList.toggle('opacity-0');
        document.body.classList.toggle('overflow-hidden');
        
        if (isHidden) {
            sidebarBackdrop.classList.remove('opacity-0');
            sidebarBackdrop.classList.remove('pointer-events-none');
        } else {
            sidebarBackdrop.classList.add('opacity-0');
            sidebarBackdrop.classList.add('pointer-events-none');
        }
    }

    filterToggle.addEventListener('click', toggleSidebar);
    closeFilter.addEventListener('click', toggleSidebar);
    sidebarBackdrop.addEventListener('click', toggleSidebar);

    // Price range slider functionality
    function updatePriceRange() {
        const min = parseInt(minPriceInput.value);
        const max = parseInt(maxPriceInput.value);

        // Ensure min doesn't exceed max
        if (min > max) {
            minPriceInput.value = max;
            minPriceValue.textContent = max;
        } else {
            minPriceValue.textContent = min;
        }

        // Ensure max doesn't go below min
        if (max < min) {
            maxPriceInput.value = min;
            maxPriceValue.textContent = min;
        } else {
            maxPriceValue.textContent = max;
        }
    }

    // Add touch-friendly events for price range sliders
    minPriceInput.addEventListener('input', updatePriceRange);
    maxPriceInput.addEventListener('input', updatePriceRange);
    minPriceInput.addEventListener('change', updatePriceRange);
    maxPriceInput.addEventListener('change', updatePriceRange);

    // Initialize price range values
    updatePriceRange();
});