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
    toast.className = `toast-notification fixed right-4 text-center w-full max-w-xs sm:max-w-sm flex items-start p-4 rounded-lg shadow-xl backdrop-blur-sm transform transition-all duration-300 z-[100] ${
        type === 'warning' ? 'bg-gradient-to-r from-amber-100 to-amber-200 border-l-4 border-amber-500 ring-1 ring-amber-300' :
        type === 'error' ? 'bg-gradient-to-r from-red-100 to-red-200 border-l-4 border-red-500 ring-1 ring-red-300' :
        'bg-gradient-to-r from-emerald-100 to-emerald-200 border-l-4 border-emerald-500 ring-1 ring-emerald-300'
    } animate-toast-enter`;

    const icon = document.createElement('div');
    icon.className = 'flex-shrink-0 mt-0.5';
    icon.innerHTML = 
        `<svg class="w-5 h-5 ${
            type === 'warning' ? 'text-amber-600' :
            type === 'error' ? 'text-red-600' :
            'text-emerald-600'
        }" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>`;

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'ml-3 flex-1';

    const content = document.createElement('div');
    content.className = `text-sm font-medium ${type === 'warning' ? 'text-amber-800' : type === 'error' ? 'text-red-800' : 'text-emerald-800'}`;
    content.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.className = `ml-4 -mt-0.5 -mr-1.5 p-1 rounded-md inline-flex ${        
        type === 'warning' ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-100 focus:ring-amber-500' :
        type === 'error' ? 'text-red-500 hover:text-red-700 hover:bg-red-100 focus:ring-red-500' :
        'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500'
    } focus:outline-none focus:ring-2`;
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
    .animate-toast-enter {
        animation: toast-enter 0.3s ease-out forwards;
    }
    .animate-toast-exit {
        animation: toast-exit 0.3s ease-in forwards;
    }
`;
document.head.appendChild(style);