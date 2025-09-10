document.addEventListener('DOMContentLoaded', function() {
  const productSlider = new Swiper('.product-slider', {
    slidesPerView: 1,
    spaceBetween: 16,
    loop: true,
    grabCursor: true,
    autoHeight: false,
    preloadImages: false,
    effect: 'slide',
    speed: 600,
    lazy: {
      loadPrevNext: true,
      loadPrevNextAmount: 2,
      loadOnTransitionStart: true
    },
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
      waitForTransition: true
    },
    keyboard: {
      enabled: true,
      onlyInViewport: true
    },
    navigation: {
      nextEl: '.product-slider .slider-next',
      prevEl: '.product-slider .slider-prev',
      hideOnClick: false
    },
    pagination: {
      el: '.product-slider .swiper-pagination',
      clickable: true,
      dynamicBullets: true
    },
    breakpoints: {
      640: {
        slidesPerView: 2,
        spaceBetween: 24,
        slidesPerGroup: 2,
        speed: 800
      },
      1024: {
        slidesPerView: 3,
        spaceBetween: 32,
        slidesPerGroup: 3,
        speed: 1000
      },
      1280: {
        slidesPerView: 4,
        spaceBetween: 32,
        slidesPerGroup: 4,
        speed: 1200
      }
    },
    on: {
      init: function() {
        setTimeout(() => {
          document.querySelector('.product-slider').classList.remove('opacity-0');
        }, 100);
      },
      touchStart: function() {
        document.querySelector('.product-slider').style.cursor = 'grabbing';
      },
      touchEnd: function() {
        document.querySelector('.product-slider').style.cursor = 'grab';
      }
    }
  });
});