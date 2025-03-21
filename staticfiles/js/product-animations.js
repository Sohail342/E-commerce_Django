// Product animations and visibility handler
(function($) {
    'use strict';

    // Function to initialize product animations
    function initProductAnimations() {
        // Make products visible initially
        $('.product').css('opacity', '1');

        // Initialize waypoints for each product
        $('.ftco-animate').each(function() {
            $(this).waypoint(function(direction) {
                if (direction === 'down' && !$(this.element).hasClass('ftco-animated')) {
                    $(this.element).addClass('ftco-animated');
                }
            }, { offset: '95%' });
        });
    }

    // Initialize when document is ready
    $(document).ready(function() {
        initProductAnimations();
    });

    // Re-initialize on window load to ensure all resources are loaded
    $(window).on('load', function() {
        initProductAnimations();
    });

})(jQuery);