/**
 * Custom JavaScript for Jazzmin Admin Panel
 * Enhances the admin interface with additional functionality
 */

document.addEventListener('DOMContentLoaded', function() {
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
    // Add animations to dashboard cards with different effects
    const dashboardCards = document.querySelectorAll('.card, .dashboard-widget');
    dashboardCards.forEach((card, index) => {
        // Alternate between different animation types
        const animationClasses = ['fade-in', 'slide-in-right', 'scale-in'];
        const animationClass = animationClasses[index % animationClasses.length];
        card.classList.add(animationClass);
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Add subtle hover effect to all cards
    dashboardCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
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