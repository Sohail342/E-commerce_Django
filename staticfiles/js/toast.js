function createToast(message, type = 'warning') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 flex items-center p-4 mb-4 rounded-lg shadow transform translate-x-full transition-transform duration-300 ease-in-out z-50 ${
        type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
        type === 'error' ? 'bg-red-50 text-red-800' :
        'bg-green-50 text-green-800'
    }`;

    const icon = document.createElement('div');
    icon.className = 'flex-shrink-0';
    icon.innerHTML = `
        <svg class="w-5 h-5 ${
            type === 'warning' ? 'text-yellow-400' :
            type === 'error' ? 'text-red-400' :
            'text-green-400'
        }" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
    `;

    const content = document.createElement('div');
    content.className = 'ml-3 text-sm font-medium';
    content.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.className = `ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8 ${
        type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-400' :
        type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-400' :
        'text-green-500 hover:bg-green-100 focus:ring-green-400'
    }`;
    closeButton.innerHTML = `
        <span class="sr-only">Close</span>
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
    `;

    closeButton.addEventListener('click', () => {
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.remove(), 300);
    });

    toast.appendChild(icon);
    toast.appendChild(content);
    toast.appendChild(closeButton);
    document.body.appendChild(toast);

    // Trigger entrance animation
    setTimeout(() => toast.classList.remove('translate-x-full'), 100);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.add('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}