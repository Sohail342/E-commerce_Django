document.addEventListener('DOMContentLoaded', function() {
  const slider = document.querySelector('.category-slider-container');
  const slides = document.querySelectorAll('.category-slide');
  const prevButton = document.querySelector('.slider-prev');
  const nextButton = document.querySelector('.slider-next');
  
  let currentIndex = 0;
  let startX = 0;
  let isDragging = false;
  let currentTranslate = 0;
  let prevTranslate = 0;
  
  function getSlidesPerView() {
    return window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : window.innerWidth < 1280 ? 3 : 4;
  }
  
  let slidesPerView = getSlidesPerView();
  let maxIndex = Math.max(0, slides.length - slidesPerView);
  
  function updateSliderPosition(animate = true) {
    // Set CSS variables for slider calculations
    slider.style.setProperty('--slides-count', slides.length);
    slider.style.setProperty('--slides-per-view', slidesPerView);
    
    const slideWidth = 100 / slidesPerView;
    const offset = currentIndex * -slideWidth;
    slider.style.transition = animate ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : '';
    slider.style.transform = `translateX(${offset}%)`;
    
    // Update navigation buttons state
    prevButton.classList.toggle('opacity-50', currentIndex === 0);
    nextButton.classList.toggle('opacity-50', currentIndex === maxIndex);
  }
  
  function handleTouchStart(e) {
    startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    isDragging = true;
    slider.style.transition = '';
  }
  
  function handleTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    const diff = (currentX - startX) * (100 / slidesPerView) / slider.offsetWidth;
    const translate = currentIndex * (-100 / slidesPerView) + diff;
    currentTranslate = translate;
    slider.style.transform = `translateX(${translate}%)`;
  }
  
  function handleTouchEnd() {
    if (!isDragging) return;
    isDragging = false;
    const threshold = 20;
    const diff = currentTranslate - prevTranslate;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex > 0) {
        currentIndex--;
      } else if (diff < 0 && currentIndex < maxIndex) {
        currentIndex++;
      }
    }
    
    updateSliderPosition();
  }
  
  prevButton.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateSliderPosition();
    }
  });
  
  nextButton.addEventListener('click', () => {
    if (currentIndex < maxIndex) {
      currentIndex++;
      updateSliderPosition();
    }
  });
  
  // Touch events
  slider.addEventListener('touchstart', handleTouchStart);
  slider.addEventListener('touchmove', handleTouchMove);
  slider.addEventListener('touchend', handleTouchEnd);
  
  // Mouse events
  slider.addEventListener('mousedown', handleTouchStart);
  slider.addEventListener('mousemove', handleTouchMove);
  slider.addEventListener('mouseup', handleTouchEnd);
  slider.addEventListener('mouseleave', handleTouchEnd);
  
  window.addEventListener('resize', () => {
    slidesPerView = getSlidesPerView();
    maxIndex = Math.max(0, slides.length - slidesPerView);
    currentIndex = Math.min(currentIndex, maxIndex);
    updateSliderPosition(false);
  });
  
  updateSliderPosition();
}));