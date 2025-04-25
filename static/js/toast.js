let toastCount = 0;

function updateToastPositions() {
    const toasts = document.querySelectorAll('.toast-notification');
    toasts.forEach((toast, index) => {
        const topOffset = 48 + (index * 80);
        toast.style.top = `${topOffset}px`;
    });
}

function createToast(message, type = 'warning') {
    toastCount++;
    const toast = document.createElement('div');
    const topOffset = 48 + (toastCount * 80); // Base offset + spacing per toast
    toast.style.top = `${topOffset}px`;
    const isCartQuantityWarning = message.includes('Maximum available quantity');
    const isWishlistRemoval = message.includes('Product removed from wishlist');
    const isSelected = message.includes('Please select at least one product before proceeding to checkout');
    
    // If the message contains HTML for quantity warning, extract the text content
    if (isCartQuantityWarning && message.includes('<div class="flex items-center">')) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = message;
        message = tempDiv.textContent.trim();
    }

    toast.className = `toast-notification fixed right-4 text-center w-full max-w-xs sm:max-w-sm flex items-start p-4 rounded-lg shadow-2xl transform transition-all duration-300 z-[9999] ${
        isCartQuantityWarning || isSelected || isWishlistRemoval ? 'bg-red-600 text-white border-l-4 border-red-800' :
        type === 'warning' ? 'bg-amber-500 text-white border-l-4 border-amber-700' :
        type === 'error' ? 'bg-red-600 text-white border-l-4 border-red-800' :
        'bg-green-600 text-white border-l-4 border-green-800'
    } animate-toast-enter hover:scale-[1.02] transition-transform`;

    const icon = document.createElement('div');
    icon.className = 'flex-shrink-0 mt-0.5';
    icon.innerHTML = isCartQuantityWarning ?
        `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>` :
        `<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>`;

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'ml-3 flex-1';

    const content = document.createElement('div');
    content.className = 'text-sm font-medium text-white';
    // Use innerHTML instead of textContent to properly render HTML content
    content.innerHTML = message;

    const closeButton = document.createElement('button');
    closeButton.className = `ml-4 -mt-0.5 -mr-1.5 p-1 rounded-md inline-flex text-white hover:text-gray-100 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors duration-200`;
    closeButton.innerHTML = 
        `<span class="sr-only">Close</span>
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>`;

    closeButton.addEventListener('click', () => {
        toast.classList.add('animate-toast-exit');
        setTimeout(() => {
            toast.remove();
            toastCount--;
            updateToastPositions();
        }, 300);
    });

    contentWrapper.appendChild(content);
    toast.appendChild(icon);
    toast.appendChild(contentWrapper);
    toast.appendChild(closeButton);
    document.body.appendChild(toast);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.add('animate-toast-exit');
            setTimeout(() => {
                toast.remove();
                toastCount--;
                updateToastPositions();
            }, 300);
        }
    }, 5000);
}

// Add these styles to your CSS or in a style tag
const style = document.createElement('style');
style.textContent = `
    @keyframes toast-enter {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes toast-exit {
        to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes toast-pulse {
        0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
        70% { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
        100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
    }
    .animate-toast-enter {
        animation: toast-enter 0.3s ease-out forwards, toast-pulse 2s infinite;
    }
    .animate-toast-exit {
        animation: toast-exit 0.3s ease-in forwards;
    }
    .toast-notification {
        transition: all 0.3s ease;
    }
    .toast-notification:hover {
        transform: translateY(-3px);
    }
`;
document.head.appendChild(style);