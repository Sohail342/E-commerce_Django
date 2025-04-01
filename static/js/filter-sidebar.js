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
    const isMobile = window.innerWidth < 1024;

    // Toggle filter sidebar with enhanced animations
    function toggleSidebar() {
        const isHidden = filterSidebar.classList.contains('-translate-x-full');
        
        // Add a slight delay for backdrop to create a staggered effect
        if (isHidden) {
            // Opening the sidebar
            filterSidebar.classList.remove('-translate-x-full');
            filterSidebar.classList.remove('pointer-events-none');
            filterSidebar.classList.remove('opacity-0');
            document.body.classList.add('overflow-hidden');
            
            // Animate backdrop with slight delay
            setTimeout(() => {
                sidebarBackdrop.classList.remove('opacity-0');
                sidebarBackdrop.classList.remove('pointer-events-none');
            }, 50);
            
            // Add entrance animation class
            filterSidebar.querySelector('div:last-child').classList.add('animate-entrance');
        } else {
            // Closing the sidebar
            sidebarBackdrop.classList.add('opacity-0');
            sidebarBackdrop.classList.add('pointer-events-none');
            
            // Slight delay before hiding sidebar
            setTimeout(() => {
                filterSidebar.classList.add('-translate-x-full');
                filterSidebar.classList.add('pointer-events-none');
                filterSidebar.classList.add('opacity-0');
                document.body.classList.remove('overflow-hidden');
            }, 100);
            
            // Remove entrance animation class
            filterSidebar.querySelector('div:last-child').classList.remove('animate-entrance');
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
            // Add visual feedback
            minPriceInput.classList.add('ring-2', 'ring-primary-500');
            setTimeout(() => {
                minPriceInput.classList.remove('ring-2', 'ring-primary-500');
            }, 500);
            window.handleSearch();
        } else {
            console.error('handleSearch function not available');
        }
    });
    
    maxPriceInput.addEventListener('change', function() {
        // Trigger search function from real-time-search.js
        if (typeof window.handleSearch === 'function') {
            // Add visual feedback
            maxPriceInput.classList.add('ring-2', 'ring-primary-500');
            setTimeout(() => {
                maxPriceInput.classList.remove('ring-2', 'ring-primary-500');
            }, 500);
            window.handleSearch();
        } else {
            console.error('handleSearch function not available');
        }
    });
    
    // Also trigger search when sort options change
    if (sortOptions) {
        sortOptions.addEventListener('change', function() {
            if (typeof window.handleSearch === 'function') {
                window.handleSearch();
            }
        });
    }
    
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

    // Handle category filter clicks
    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.addEventListener('click', function(e) {
            e.preventDefault();
            // Remove active class from all filters
            document.querySelectorAll('.category-filter').forEach(f => f.classList.remove('active'));
            // Add active class to clicked filter
            this.classList.add('active');
            // Trigger search with new category
            if (typeof window.handleSearch === 'function') {
                window.handleSearch();
            }
        });
    });
    
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
    
    // Initialize filter sections with smooth animations - first section open, others closed
    document.querySelectorAll('.filter-content').forEach((content, index) => {
        // Set initial styles for all sections with enhanced transitions
        content.style.transition = 'height 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms ease-in-out';
        
        if (index === 0 && !isMobile) {
            // First section open on desktop
            content.style.height = content.scrollHeight + 'px';
            content.style.opacity = '1';
            content.style.overflow = 'visible';
            content.classList.add('filter-content-active');
            
            // Rotate chevron for first section
            const heading = content.previousElementSibling;
            if (heading && heading.classList.contains('filter-heading')) {
                const chevron = heading.querySelector('.chevron-icon');
                if (chevron) {
                    chevron.classList.add('rotate-180');
                }
                // Add active styling to heading
                heading.classList.add('bg-primary-50');
                heading.classList.add('text-primary-700');
            }
        } else {
            // Initially hide all other filter sections
            content.style.height = '0';
            content.style.opacity = '0';
            content.style.overflow = 'hidden';
            content.classList.remove('filter-content-active');
            
            // Find the corresponding heading and rotate the chevron to indicate closed state
            const heading = content.previousElementSibling;
            if (heading && heading.classList.contains('filter-heading')) {
                const chevron = heading.querySelector('.chevron-icon');
                if (chevron) {
                    chevron.classList.remove('rotate-180');
                }
            }
        }
    });
    
    // Add a small delay to ensure smooth initial rendering
    setTimeout(() => {
        document.querySelectorAll('.filter-content').forEach((content) => {
            content.style.transition = 'height 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms ease-in-out';
        });
    }, 100);
    
    // Add window resize handler for responsive behavior
    window.addEventListener('resize', function() {
        const newIsMobile = window.innerWidth < 1024;
        
        // Only update if mobile state changed
        if (newIsMobile !== isMobile) {
            // Update mobile state
            isMobile = newIsMobile;
            
            // Reset filter sidebar on mobile/desktop switch
            if (!isMobile) {
                // Switching to desktop
                filterSidebar.classList.remove('-translate-x-full');
                filterSidebar.classList.remove('pointer-events-none');
                filterSidebar.classList.remove('opacity-0');
                document.body.classList.remove('overflow-hidden');
                sidebarBackdrop.classList.add('opacity-0');
                sidebarBackdrop.classList.add('pointer-events-none');
            } else {
                // Switching to mobile
                filterSidebar.classList.add('-translate-x-full');
                filterSidebar.classList.add('pointer-events-none');
                filterSidebar.classList.add('opacity-0');
            }
        }
    });
});