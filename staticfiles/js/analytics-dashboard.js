/**
 * Analytics Dashboard Enhancement Script
 * Improves the analytics dashboard with better visualizations and data handling
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard enhancements
    initAnalyticsDashboard();
    
    // Setup chart refresh functionality
    setupChartRefresh();
    
    // Add responsive behaviors
    addResponsiveBehaviors();
    
    // Fix website visits display
    fixWebsiteVisitsDisplay();
});

/**
 * Initialize the analytics dashboard with enhanced features
 */
function initAnalyticsDashboard() {
    // Add classes to dashboard elements for styling
    const metricCards = document.querySelectorAll('.rounded-lg.shadow-lg.p-6');
    metricCards.forEach(card => {
        card.classList.add('analytics-card', 'metric-card');
        
        // Add animation attributes
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-duration', '800');
        
        // Add hover effect
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
    
    // Enhance chart containers
    const chartContainers = document.querySelectorAll('.bg-white.rounded-lg.shadow-lg.p-6');
    chartContainers.forEach(container => {
        if (container.querySelector('canvas')) {
            container.classList.add('chart-container');
            container.setAttribute('data-aos', 'fade-up');
            container.setAttribute('data-aos-delay', '200');
        }
    });
    
    // Enhance tables
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        table.classList.add('analytics-table');
        table.setAttribute('data-aos', 'fade-up');
        table.setAttribute('data-aos-delay', '300');
    });
    
    // Style trend indicators
    const trendIndicators = document.querySelectorAll('[class*="text-green"], [class*="text-red"]');
    trendIndicators.forEach(indicator => {
        if (indicator.classList.contains('text-green-500')) {
            indicator.classList.add('trend-indicator', 'trend-up');
            indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" class="mr-1"><path d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z" transform="rotate(180) translate(-16, -16)"/></svg>` + indicator.innerHTML;
        } else if (indicator.classList.contains('text-red-500')) {
            indicator.classList.add('trend-indicator', 'trend-down');
            indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" class="mr-1"><path d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z"/></svg>` + indicator.innerHTML;
        }
    });
}

/**
 * Setup chart refresh functionality
 */
function setupChartRefresh() {
    // Add refresh buttons to chart containers
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        const refreshButton = document.createElement('button');
        refreshButton.className = 'refresh-chart-btn';
        refreshButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>`;
        refreshButton.style.position = 'absolute';
        refreshButton.style.top = '10px';
        refreshButton.style.right = '10px';
        refreshButton.style.background = 'none';
        refreshButton.style.border = 'none';
        refreshButton.style.color = '#6c757d';
        refreshButton.style.cursor = 'pointer';
        refreshButton.style.zIndex = '10';
        refreshButton.style.transition = 'all 0.3s ease';
        
        refreshButton.addEventListener('mouseenter', function() {
            this.style.transform = 'rotate(180deg)';
            this.style.color = '#3a6ea5';
        });
        
        refreshButton.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.color = '#6c757d';
        });
        
        refreshButton.addEventListener('click', function() {
            refreshChartData(container);
        });
        
        container.style.position = 'relative';
        container.appendChild(refreshButton);
    });
}

/**
 * Refresh chart data with loading animation
 */
function refreshChartData(container) {
    const canvas = container.querySelector('canvas');
    if (!canvas) return;
    
    // Create and show loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'chart-loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="spinner"></div>
        <p>Refreshing data...</p>
    `;
    loadingOverlay.style.position = 'absolute';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.flexDirection = 'column';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    loadingOverlay.style.zIndex = '5';
    loadingOverlay.style.borderRadius = '8px';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.style.width = '40px';
    spinner.style.height = '40px';
    spinner.style.border = '4px solid rgba(0, 0, 0, 0.1)';
    spinner.style.borderRadius = '50%';
    spinner.style.borderTopColor = '#3a6ea5';
    spinner.style.animation = 'spin 1s linear infinite';
    
    loadingOverlay.appendChild(spinner);
    container.appendChild(loadingOverlay);
    
    // Simulate data refresh (in a real app, this would be an API call)
    setTimeout(() => {
        // Remove loading overlay
        loadingOverlay.remove();
        
        // Refresh the page to get new data
        window.location.reload();
    }, 1500);
}

/**
 * Add responsive behaviors to the dashboard
 */
function addResponsiveBehaviors() {
    // Add responsive classes and behaviors
    const mainContent = document.querySelector('.max-w-7xl');
    if (mainContent) {
        // Add responsive padding
        mainContent.style.padding = '0 1rem';
        
        // Add media query for smaller screens
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        function handleScreenChange(