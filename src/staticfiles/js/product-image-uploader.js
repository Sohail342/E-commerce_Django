/**
 * Product Image Uploader
 * Handles AJAX image uploads for product detail pages
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the image uploader if it exists on the page
  initImageUploader();
});

function initImageUploader() {
  const imageUploader = document.getElementById('product-image-uploader');
  if (!imageUploader) return;

  const productId = imageUploader.dataset.productId;
  const uploadInput = document.getElementById('image-upload-input');
  const uploadButton = document.getElementById('image-upload-button');
  const uploadPreview = document.getElementById('image-upload-preview');
  const uploadForm = document.getElementById('image-upload-form');
  const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  const uploadProgress = document.getElementById('upload-progress');
  const uploadProgressBar = document.getElementById('upload-progress-bar');
  const uploadGallery = document.getElementById('upload-image-gallery');

  // Handle file selection for preview
  uploadInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showUploadError('Please select an image file (JPEG, PNG, etc.)');
      uploadInput.value = '';
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showUploadError('Image file is too large. Maximum size is 5MB.');
      uploadInput.value = '';
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadPreview.innerHTML = `
        <div class="relative w-full h-full">
          <img src="${e.target.result}" alt="Preview" class="w-full h-full object-contain rounded-lg">
          <button type="button" id="cancel-preview" class="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors">
            <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      `;
      uploadPreview.classList.remove('hidden');
      uploadButton.textContent = 'Upload This Image';
      uploadButton.classList.remove('bg-gray-200', 'cursor-not-allowed');
      uploadButton.classList.add('bg-primary-600', 'hover:bg-primary-700');
      uploadButton.disabled = false;

      // Add cancel button functionality
      document.getElementById('cancel-preview').addEventListener('click', function() {
        uploadInput.value = '';
        uploadPreview.innerHTML = '';
        uploadPreview.classList.add('hidden');
        uploadButton.textContent = 'Select Image';
        uploadButton.classList.add('bg-gray-200', 'cursor-not-allowed');
        uploadButton.classList.remove('bg-primary-600', 'hover:bg-primary-700');
        uploadButton.disabled = true;
      });
    };
    reader.readAsDataURL(file);
  });

  // Handle form submission
  uploadForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!uploadInput.files[0]) return;

    const formData = new FormData();
    formData.append('image', uploadInput.files[0]);
    formData.append('csrfmiddlewaretoken', csrfToken);
    formData.append('alt_text', document.getElementById('image-alt-text').value || '');

    // Show progress bar
    uploadProgress.classList.remove('hidden');
    uploadProgressBar.style.width = '0%';
    uploadButton.disabled = true;
    uploadButton.innerHTML = '<span class="spinner"></span> Uploading...';

    // Send AJAX request
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/shop/product/${productId}/ajax-upload-image/`);

    // Track upload progress
    xhr.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        uploadProgressBar.style.width = percentComplete + '%';
      }
    });

    xhr.onload = function() {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        if (response.status === 'success') {
          // Show success message
          showUploadSuccess('Image uploaded successfully!');
          
          // Add the new image to the gallery
          addImageToGallery(response.image);
          
          // Reset the form
          uploadInput.value = '';
          uploadPreview.innerHTML = '';
          uploadPreview.classList.add('hidden');
          document.getElementById('image-alt-text').value = '';
          uploadButton.textContent = 'Select Image';
          uploadButton.classList.add('bg-gray-200', 'cursor-not-allowed');
          uploadButton.classList.remove('bg-primary-600', 'hover:bg-primary-700');
          uploadButton.disabled = true;
          
          // If this is the first image, reload the page to show it in the main gallery
          if (document.querySelector('.product-main-gallery .swiper-slide') === null) {
            window.location.reload();
          }
        } else {
          showUploadError(response.message || 'Upload failed. Please try again.');
        }
      } else {
        showUploadError('Upload failed. Please try again.');
      }
      
      // Hide progress bar
      setTimeout(() => {
        uploadProgress.classList.add('hidden');
        uploadButton.innerHTML = 'Select Image';
        uploadButton.disabled = false;
      }, 1000);
    };

    xhr.onerror = function() {
      showUploadError('Network error. Please try again.');
      uploadProgress.classList.add('hidden');
      uploadButton.innerHTML = 'Select Image';
      uploadButton.disabled = false;
    };

    xhr.send(formData);
  });

  // Handle the select image button click
  uploadButton.addEventListener('click', function() {
    if (uploadButton.disabled && !uploadInput.files[0]) {
      uploadInput.click();
    }
  });
}

function showUploadError(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg bg-red-500 text-white transform transition-transform duration-300';
  toast.innerHTML = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('translate-y-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function showUploadSuccess(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg bg-green-500 text-white transform transition-transform duration-300';
  toast.innerHTML = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('translate-y-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function addImageToGallery(image) {
  if (!document.getElementById('upload-image-gallery')) return;
  
  const imageElement = document.createElement('div');
  imageElement.className = 'relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200';
  imageElement.innerHTML = `
    <img src="${image.url}" alt="${image.alt_text}" class="w-full h-full object-contain">
    ${image.is_primary ? '<div class="absolute top-2 right-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full">Primary</div>' : ''}
  `;
  
  document.getElementById('upload-image-gallery').prepend(imageElement);
}