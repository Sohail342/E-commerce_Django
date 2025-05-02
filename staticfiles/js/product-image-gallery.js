document.addEventListener('DOMContentLoaded', function() {
  // Initialize the main product gallery
  const productMainGallery = new Swiper('.product-main-gallery', {
    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    grabCursor: true,
    autoHeight: false,
    effect: 'fade', // Use fade effect for smoother transitions
    fadeEffect: {
      crossFade: true
    },
    speed: 500,
    navigation: {
      nextEl: '.product-main-gallery .swiper-button-next',
      prevEl: '.product-main-gallery .swiper-button-prev',
    },
    pagination: {
      el: '.product-main-gallery .swiper-pagination',
      clickable: true,
      dynamicBullets: true
    },
    keyboard: {
      enabled: true,
      onlyInViewport: true
    },
    zoom: {
      maxRatio: 3,
      minRatio: 1,
    },
    lazy: {
      loadPrevNext: true,
      loadOnTransitionStart: true
    },
  });

  // Initialize the thumbnail gallery if it exists
  if (document.querySelector('.product-thumbs-gallery')) {
    const productThumbsGallery = new Swiper('.product-thumbs-gallery', {
      slidesPerView: 4,
      spaceBetween: 10,
      freeMode: true,
      watchSlidesProgress: true,
      breakpoints: {
        640: {
          slidesPerView: 5,
          spaceBetween: 15,
        },
      },
    });

    // Link the thumbnail gallery to the main gallery
    productMainGallery.controller.control = productThumbsGallery;
    productThumbsGallery.controller.control = productMainGallery;

    // Add click event to thumbnails for direct navigation
    const thumbnails = document.querySelectorAll('.product-thumbs-gallery .swiper-slide');
    thumbnails.forEach((thumbnail, index) => {
      thumbnail.addEventListener('click', () => {
        productMainGallery.slideTo(index);
      });
    });
  }
});