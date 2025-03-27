document.addEventListener('DOMContentLoaded', function() {
    const filterToggle = document.getElementById('filterToggle');
    const filterSidebar = document.getElementById('filterSidebar');
    const closeFilter = document.getElementById('closeFilter');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const minPriceValue = document.getElementById('minPriceValue');
    const maxPriceValue = document.getElementById('maxPriceValue');
    const filterHeadings = document.querySelectorAll('.filter-heading');
    const sortOptions = document.getElementById('sortOptions');

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
    
    // Add event listeners to trigger search when price range changes
    minPriceInput.addEventListener('change', function() {
        // Trigger search function from real-time-search.js
        if (typeof window.handleSearch === 'function') {
            window.handleSearch();
        } else {
            console.error('handleSearch function not available');
        }
    });
    
    maxPriceInput.addEventListener('change', function() {
        // Trigger search function from real-time-search.js
        if (typeof window.handleSearch === 'function') {
            window.handleSearch();
        } else {
            console.error('handleSearch function not available');
        }
    });
    
    // Also add input event listeners for smoother experience
    minPriceInput.addEventListener('input', function() {
        // Update the display value immediately
        if (minPriceValue) minPriceValue.textContent = this.value;
    });
    
    maxPriceInput.addEventListener('input', function() {
        // Update the display value immediately
        if (maxPriceValue) maxPriceValue.textContent = this.value;
    });

    // Initialize price range values
    updatePriceRange();
    
    // Enhanced collapsible filter sections with smooth animations
    filterHeadings.forEach(heading => {
        heading.addEventListener('click', (e) => {
            // Prevent the event from bubbling up to parent elements
            e.stopPropagation();
            
            // Find the content container that follows this heading
            const content = heading.nextElementSibling;
            
            // Toggle the chevron icon direction with smooth rotation
            const chevron = heading.querySelector('.chevron-icon');
            if (chevron) {
                chevron.classList.toggle('rotate-180');
            }
            
            // Toggle active state for the heading
            heading.classList.toggle('bg-primary-50');
            heading.classList.toggle('text-primary-700');
            
            // Smooth height animation for content
            if (content.classList.contains('filter-content-active')) {
                // Closing the section
                content.style.height = content.scrollHeight + 'px';
                // Force a reflow
                content.offsetHeight;
                content.style.height = '0';
                content.style.opacity = '0';
                content.style.overflow = 'hidden';
                
                // Remove active class after transition completes
                setTimeout(() => {
                    content.classList.remove('filter-content-active');
                }, 300);
            } else {
                // Opening the section
                content.classList.add('filter-content-active');
                content.style.height = '0';
                content.style.opacity = '0';
                content.style.overflow = 'hidden';
                // Force a reflow
                content.offsetHeight;
                content.style.height = content.scrollHeight + 'px';
                content.style.opacity = '1';
                
                // Remove height constraint after animation completes
                setTimeout(() => {
                    content.style.height = '';
                    content.style.overflow = '';
                }, 300);
            }
        });
        
        // Add touch feedback effect
        heading.addEventListener('touchstart', () => {
            heading.classList.add('bg-gray-100');
        }, { passive: true });
        
        heading.addEventListener('touchend', () => {
            heading.classList.remove('bg-gray-100');
        }, { passive: true });
    });
    
    // Make sure category items don't close the dropdown when clicked
    document.querySelectorAll('.filter-content input, .filter-content label').forEach(element => {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
    
    // Initialize filter sections with smooth animations - show Categories and Price Range by default
    document.querySelectorAll('.filter-content').forEach((content, index) => {
        // Set initial styles for all sections
        content.style.transition = 'height 300ms ease-in-out, opacity 300ms ease-in-out';
        
        // Only hide sections after the first two (Categories and Price Range)
        if (index > 1) {
            content.style.height = '0';
            content.style.opacity = '0';
            content.style.overflow = 'hidden';
        } else {
            // Make sure the first two sections are visible and animated
            content.classList.add('filter-content-active');
            content.style.height = content.scrollHeight + 'px';
            content.style.opacity = '1';
            
            // Remove height constraint after initial setup
            setTimeout(() => {
                content.style.height = '';
                content.style.overflow = '';
            }, 50);
            
            // Update the chevron icon for the visible sections
            const heading = content.previousElementSibling;
            const chevron = heading?.querySelector('.chevron-icon');
            if (chevron) {
                chevron.classList.add('rotate-180');
            }
            
            // Add active state to the heading
            if (heading) {
                heading.classList.add('bg-primary-50');
                heading.classList.add('text-primary-700');
            }
        }
    });
});