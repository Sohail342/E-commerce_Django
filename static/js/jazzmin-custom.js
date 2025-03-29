/**
 * Custom JavaScript for Jazzmin Admin Panel - Modern E-commerce Edition
 * Enhances the admin interface with modern e-commerce functionality, animations,
 * and improved user experience features
 * Version 2.0 - Enhanced UI and Performance
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize performance tracking
    console.time('Jazzmin Admin UI Initialization');
    
    // Fix for app names not displaying
    const fixAppNames = function() {
        // Target all app names and section headers
        const appNames = document.querySelectorAll('.app-name, .section-header, .section-title, .app-title, h2.section, .dashboard h2');
        
        // Make sure they're visible
        appNames.forEach(element => {
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
        });
    };
    
    // Call the function to fix app names
    fixAppNames();
    
    // Add modern UI enhancements
    enhanceAdminUI();
    // Replace profile icon with logout button in admin navbar
    function addLogoutButtonToNavbar() {
        const navbar = document.querySelector('.navbar-nav.ml-auto');
        if (navbar) {
            // Find and remove the profile icon/user menu if it exists
            const userMenu = navbar.querySelector('.user-menu');
            if (userMenu) {
                userMenu.remove();
            }
            
            // Create logout button with enhanced styling
            const logoutButton = document.createElement('li');
            logoutButton.className = 'nav-item';
            logoutButton.innerHTML = `
                <a href="/admin/logout/" class="nav-link" title="Logout" style="color: #fff; padding: 0.5rem 1rem; display: flex; align-items: center; background-color: rgba(255, 255, 255, 0.1); border-radius: 4px; margin-left: 10px; font-weight: 500;">
                    <i class="fas fa-sign-out-alt" style="font-size: 1.2rem; margin-right: 0.5rem;"></i>
                    <span class="d-none d-md-inline">Logout</span>
                </a>
            `;
            
            // Add hover effect and get the logout link
            const logoutLink = logoutButton.querySelector('a');
            logoutLink.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
            });
            
            logoutLink.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                this.style.transform = '';
                this.style.boxShadow = '';
            });
            
            // Add confirmation dialog
            logoutLink.addEventListener('click', function(e) {
                if (!confirm('Are you sure you want to logout?')) {
                    e.preventDefault();
                }
            });
            
            // Add ripple effect
            logoutLink.addEventListener('click', function(e) {
                if (confirm('Are you sure you want to logout?')) {
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const ripple = document.createElement('span');
                    ripple.classList.add('btn-ripple');
                    ripple.style.left = `${x}px`;
                    ripple.style.top = `${y}px`;
                    
                    this.appendChild(ripple);
                    
                    setTimeout(() => {
                        ripple.remove();
                    }, 600);
                }
            });
            
            // Add to navbar
            navbar.appendChild(logoutButton);
        }
    }
    
    // Call the function to add logout button
    addLogoutButtonToNavbar();
    // Enhanced animations to dashboard cards with different effects
    const dashboardCards = document.querySelectorAll('.card, .dashboard-widget');
    dashboardCards.forEach((card, index) => {
        // Alternate between different animation types for visual variety
        const animationClasses = ['fade-in', 'slide-in-right', 'slide-in-left', 'scale-in', 'bounce-in'];
        const animationClass = animationClasses[index % animationClasses.length];
        card.classList.add(animationClass);
        card.style.animationDelay = `${index * 0.1}s`;
        
        // Add data attribute for analytics tracking
        card.setAttribute('data-card-index', index);
        card.setAttribute('data-animation-type', animationClass);
    });
    
    // Add enhanced hover effects to all cards with smooth transitions
    dashboardCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.15), 0 8px 15px rgba(0, 0, 0, 0.08)';
            this.style.borderColor = 'var(--accent-color)';
            
            // Add subtle glow effect
            this.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
            
            // Highlight card header if exists
            const cardHeader = this.querySelector('.card-header');
            if (cardHeader) {
                cardHeader.style.backgroundColor = 'var(--light-accent)';
                cardHeader.style.color = 'var(--primary-color)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
            this.style.borderColor = '';
            
            // Reset card header if exists
            const cardHeader = this.querySelector('.card-header');
            if (cardHeader) {
                cardHeader.style.backgroundColor = '';
                cardHeader.style.color = '';
            }
        });
        
        // Add click effect
        card.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 5px 10px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.15), 0 8px 15px rgba(0, 0, 0, 0.08)';
        });
    });
    
    // Fix user menu dropdown functionality
    const userMenuToggle = document.querySelector('.user-menu .nav-link');
    if (userMenuToggle) {
        userMenuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            const dropdown = this.nextElementSibling;
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                dropdown.style.display = 'none';
            } else {
                // Close any open dropdowns first
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                    menu.style.display = 'none';
                });
                dropdown.classList.add('show');
                dropdown.style.display = 'block';
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenuToggle.contains(e.target)) {
                const dropdown = document.querySelector('.user-menu .dropdown-menu');
                if (dropdown) {
                    dropdown.classList.remove('show');
                    dropdown.style.display = 'none';
                }
            }
        });
    }

    // Enhanced tooltip functionality for all interactive elements
    const interactiveElements = document.querySelectorAll('.btn, .nav-link, .action-button, [title]');
    interactiveElements.forEach(element => {
        if (element.title && element.title.trim() !== '') {
            element.setAttribute('data-toggle', 'tooltip');
            element.setAttribute('data-placement', 'top');
            // Add a subtle animation class
            element.classList.add('has-tooltip');
        }
    });

    // Initialize Bootstrap tooltips with custom animation
    if (typeof $ !== 'undefined' && $.fn.tooltip) {
        $('[data-toggle="tooltip"]').tooltip({
            animation: true,
            delay: { show: 100, hide: 100 },
            template: '<div class="tooltip" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>'
        });
    }
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.classList.add('btn-ripple');
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Enhance sidebar navigation
    const sidebarItems = document.querySelectorAll('.sidebar .nav-item');
    sidebarItems.forEach(item => {
        // Add hover effect
        item.addEventListener('mouseenter', function() {
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(1.2)';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    });

    // Add confirmation for delete actions
    const deleteButtons = document.querySelectorAll('a[href*="delete"]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
                e.preventDefault();
            }
        });
    });

    // Add analytics dashboard enhancements
    function enhanceAnalyticsDashboard() {
        // Check if we're on the analytics page
        if (window.location.href.includes('/dashboard/analytics/')) {
            console.log('Enhancing analytics dashboard...');
            
            // Fix website visits display issues
            const trafficTrendsChart = document.getElementById('trafficTrendsChart');
            const conversionFunnelChart = document.getElementById('conversionFunnelChart');
            
            if (trafficTrendsChart && window.Chart) {
                // Add loading indicator
                const loadingOverlay = document.createElement('div');
                loadingOverlay.className = 'chart-loading-overlay';
                loadingOverlay.innerHTML = '<div class="spinner"></div><p>Loading chart data...</p>';
                trafficTrendsChart.parentNode.appendChild(loadingOverlay);
                
                // Refresh chart data after a short delay
                setTimeout(() => {
                    // Remove loading overlay
                    loadingOverlay.remove();
                    
                    // If chart data is empty or undefined, show a message
                    const chartInstance = Chart.getChart(trafficTrendsChart);
                    if (chartInstance && (!chartInstance.data.datasets[0].data || chartInstance.data.datasets[0].data.length === 0)) {
                        // Create a message element
                        const noDataMessage = document.createElement('div');
                        noDataMessage.className = 'no-data-message';
                        noDataMessage.innerHTML = '<p>No website visits data available for the selected period. Data will appear here once visitors browse your site.</p>';
                        trafficTrendsChart.parentNode.appendChild(noDataMessage);
                        
                        // Style the message
                        noDataMessage.style.textAlign = 'center';
                        noDataMessage.style.padding = '2rem';
                        noDataMessage.style.color = 'var(--muted-text)';
                        noDataMessage.style.backgroundColor = 'var(--light-accent)';
                        noDataMessage.style.borderRadius = 'var(--border-radius)';
                        noDataMessage.style.marginTop = '1rem';
                    }
                }, 1000);
            }
            
            // Add refresh button to analytics cards
            const analyticsCards = document.querySelectorAll('.bg-white.rounded-lg.shadow-lg');
            analyticsCards.forEach(card => {
                const refreshButton = document.createElement('button');
                refreshButton.className = 'refresh-data-btn';
                refreshButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>';
                refreshButton.style.position = 'absolute';
                refreshButton.style.top = '12px';
                refreshButton.style.right = '12px';
                refreshButton.style.background = 'none';
                refreshButton.style.border = 'none';
                refreshButton.style.color = 'var(--muted-text)';
                refreshButton.style.cursor = 'pointer';
                refreshButton.style.transition = 'transform 0.3s ease';
                
                refreshButton.addEventListener('mouseenter', function() {
                    this.style.transform = 'rotate(180deg)';
                    this.style.color = 'var(--primary-color)';
                });
                
                refreshButton.addEventListener('mouseleave', function() {
                    this.style.transform = 'rotate(0)';
                    this.style.color = 'var(--muted-text)';
                });
                
                refreshButton.addEventListener('click', function() {
                    // Add spinning animation
                    this.style.animation = 'spin 1s linear infinite';
                    
                    // Simulate data refresh
                    setTimeout(() => {
                        this.style.animation = '';
                        window.location.reload();
                    }, 1000);
                });
                
                // Make sure card has position relative for absolute positioning of the button
                card.style.position = 'relative';
                card.appendChild(refreshButton);
            });
            
            // Add CSS for animations
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .chart-loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background-color: rgba(255, 255, 255, 0.8);
                    border-radius: var(--border-radius);
                    z-index: 10;
                }
                
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    border-radius: 50%;
                    border-top-color: var(--primary-color);
                    animation: spin 1s linear infinite;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Call the function to enhance analytics dashboard
    enhanceAnalyticsDashboard();
    
    // Add search box enhancement
    const searchBox = document.querySelector('input[name="q"]');
    if (searchBox) {
        searchBox.setAttribute('placeholder', 'Search expenses, vendors, etc...');
        searchBox.addEventListener('focus', function() {
            this.parentElement.style.boxShadow = '0 0 0 0.2rem rgba(0, 163, 204, 0.25)';
        });
        searchBox.addEventListener('blur', function() {
            this.parentElement.style.boxShadow = 'none';
        });
    }

    // Add quick filters for expense list
    const contentContainer = document.querySelector('#content-main');
    if (contentContainer && window.location.href.includes('/admin/expenses/expense/')) {
        const filterDiv = document.createElement('div');
        filterDiv.className = 'card mb-3';
        filterDiv.innerHTML = `
            <div class="card-header">
                <i class="fas fa-filter"></i> Quick Filters
            </div>
            <div class="card-body">
                <div class="btn-group mb-3" role="group">
                    <button type="button" class="btn btn-sm btn-outline-primary filter-btn" data-status="all">All</button>
                    <button type="button" class="btn btn-sm btn-outline-primary filter-btn" data-status="Pending">Pending</button>
                    <button type="button" class="btn btn-sm btn-outline-primary filter-btn" data-status="Approved">Approved</button>
                    <button type="button" class="btn btn-sm btn-outline-primary filter-btn" data-status="Rejected">Rejected</button>
                </div>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-sm btn-outline-secondary filter-btn" data-period="today">Today</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary filter-btn" data-period="week">This Week</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary filter-btn" data-period="month">This Month</button>
                </div>
            </div>
        `;
        
        const listHeader = contentContainer.querySelector('.results');
        if (listHeader) {
            contentContainer.insertBefore(filterDiv, listHeader);
            
            // Add event listeners to filter buttons
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const status = this.getAttribute('data-status');
                    const period = this.getAttribute('data-period');
                    
                    // Here you would implement the actual filtering logic
                    // For now, we'll just highlight the active button
                    if (status) {
                        document.querySelectorAll('[data-status]').forEach(btn => {
                            btn.classList.remove('active');
                        });
                    }
                    
                    if (period) {
                        document.querySelectorAll('[data-period]').forEach(btn => {
                            btn.classList.remove('active');
                        });
                    }
                    
                    this.classList.add('active');
                    
                    // This would be replaced with actual filtering code
                    console.log(`Filtering by: ${status || ''} ${period || ''}`);
                });
            });
        }
    }

    // Add dashboard stats summary if on index page
    if (window.location.pathname.endsWith('/admin/')) {
        const contentContainer = document.querySelector('#content');
        if (contentContainer) {
            const statsRow = document.createElement('div');
            statsRow.className = 'row';
            statsRow.innerHTML = `
                <div class="col-md-3">
                    <div class="dashboard-widget p-3 mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="m-0">Total Expenses</h5>
                                <p class="text-muted m-0">All time</p>
                            </div>
                            <div class="dashboard-widget-icon">
                                <i class="fas fa-money-bill fa-2x"></i>
                            </div>
                        </div>
                        <h3 class="mt-3 mb-0">Loading...</h3>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="dashboard-widget p-3 mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="m-0">Pending Approval</h5>
                                <p class="text-muted m-0">Requires action</p>
                            </div>
                            <div class="dashboard-widget-icon">
                                <i class="fas fa-clock fa-2x"></i>
                            </div>
                        </div>
                        <h3 class="mt-3 mb-0">Loading...</h3>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="dashboard-widget p-3 mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="m-0">Active Vendors</h5>
                                <p class="text-muted m-0">Currently working with</p>
                            </div>
                            <div class="dashboard-widget-icon">
                                <i class="fas fa-building fa-2x"></i>
                            </div>
                        </div>
                        <h3 class="mt-3 mb-0">Loading...</h3>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="dashboard-widget p-3 mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="m-0">Budget Utilization</h5>
                                <p class="text-muted m-0">Current fiscal year</p>
                            </div>
                            <div class="dashboard-widget-icon">
                                <i class="fas fa-chart-pie fa-2x"></i>
                            </div>
                        </div>
                        <h3 class="mt-3 mb-0">Loading...</h3>
                    </div>
                </div>
            `;
            
            const firstChild = contentContainer.firstChild;
            if (firstChild) {
                contentContainer.insertBefore(statsRow, firstChild);
            } else {
                contentContainer.appendChild(statsRow);
            }
            
            // Simulate loading data (in a real app, this would be an API call)
            setTimeout(() => {
                document.querySelectorAll('.dashboard-widget h3').forEach((el, index) => {
                    const values = ['$124,568.00', '12', '24', '68%'];
                    el.textContent = values[index];
                    el.style.animation = 'fadeIn 0.5s ease-out forwards';
                });
            }, 1000);
        }
    }
});