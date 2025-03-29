document.addEventListener('DOMContentLoaded', function() {
    const countdownElement = document.getElementById('sale-countdown');
    if (!countdownElement) return;

    const endDate = new Date(countdownElement.dataset.endDate).getTime();
    
    // Update the countdown every second
    const countdownTimer = setInterval(function() {
        // Get current date and time
        const now = new Date().getTime();
        
        // Find the time remaining between now and the countdown end date
        const timeRemaining = endDate - now;
        
        // If the countdown is over, display expired message and stop the timer
        if (timeRemaining < 0) {
            clearInterval(countdownTimer);
            countdownElement.innerHTML = `
                <div class="flex items-center justify-center w-full">
                    <div class="inline-flex items-center justify-center w-full py-2 px-4 bg-red-50 rounded-lg border border-red-500 shadow-md">
                        <svg class="h-4 w-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                        <span class="text-red-600 text-sm font-medium">Sale has ended!</span>
                    </div>
                </div>
            `;
            
            // Optional: reload the page to update the product price
            // setTimeout(() => { location.reload(); }, 3000);
            return;
        }
        
        // Calculate days, hours, minutes and seconds remaining
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
        
        // Determine urgency class based on time remaining with simplified styling
        let borderClass = '';
        if (days === 0) {
            if (hours < 2) {
                borderClass = 'border-red-500'; // Very urgent - less than 2 hours
            } else if (hours < 5) {
                borderClass = 'border-red-400'; // Urgent - less than 5 hours
            } else {
                borderClass = 'border-red-400'; // Soon - less than a day
            }
        } else if (days === 1) {
            borderClass = 'border-red-300'; // Tomorrow
        } else {
            borderClass = 'border-red-300'; // Default
        }
        
        // Create the countdown display with responsive design
        // Mobile-first approach with sm: breakpoint for larger screens
        let countdownHTML = `
        <div class="relative bg-white rounded-lg shadow-sm border border-red-100 p-2 mx-auto max-w-full">
            <div class="flex justify-center items-center space-x-2 sm:space-x-3 text-center">
                <!-- Days -->
                <div class="flex flex-col items-center">
                    <div class="bg-red-50 border ${borderClass} w-10 sm:w-14 h-10 sm:h-14 flex items-center justify-center rounded-md shadow-sm hover:shadow transition-all duration-200 hover:scale-105">
                        <span class="text-sm sm:text-lg font-bold text-red-600">${days}</span>
                    </div>
                    <div class="text-[10px] sm:text-xs font-medium text-gray-600 mt-1 uppercase">Days</div>
                </div>
                
                <!-- Separator -->
                <div class="text-red-500 text-sm sm:text-lg font-bold self-start mt-2">:</div>
                
                <!-- Hours -->
                <div class="flex flex-col items-center">
                    <div class="bg-red-50 border ${borderClass} w-10 sm:w-14 h-10 sm:h-14 flex items-center justify-center rounded-md shadow-sm hover:shadow transition-all duration-200 hover:scale-105">
                        <span class="text-sm sm:text-lg font-bold text-red-600">${hours}</span>
                    </div>
                    <div class="text-[10px] sm:text-xs font-medium text-gray-600 mt-1 uppercase">Hrs</div>
                </div>
                
                <!-- Separator -->
                <div class="text-red-500 text-sm sm:text-lg font-bold self-start mt-2">:</div>
                
                <!-- Minutes -->
                <div class="flex flex-col items-center">
                    <div class="bg-red-50 border ${borderClass} w-10 sm:w-14 h-10 sm:h-14 flex items-center justify-center rounded-md shadow-sm hover:shadow transition-all duration-200 hover:scale-105">
                        <span class="text-sm sm:text-lg font-bold text-red-600">${minutes}</span>
                    </div>
                    <div class="text-[10px] sm:text-xs font-medium text-gray-600 mt-1 uppercase">Min</div>
                </div>
                
                <!-- Separator -->
                <div class="text-red-500 text-sm sm:text-lg font-bold self-start mt-2">:</div>
                
                <!-- Seconds with pulse animation -->
                <div class="flex flex-col items-center">
                    <div class="bg-red-50 border ${borderClass} w-10 sm:w-14 h-10 sm:h-14 flex items-center justify-center rounded-md shadow-sm animate-pulse">
                        <span class="text-sm sm:text-lg font-bold text-red-600">${seconds}</span>
                    </div>
                    <div class="text-[10px] sm:text-xs font-medium text-gray-600 mt-1 uppercase">Sec</div>
                </div>
            </div>
            
            <!-- Sale urgency message with enhanced visibility -->
            ${days === 0 && hours < 5 ? `
            <div class="mt-2 text-center">
                <span class="px-3 py-1 rounded-full ${hours < 2 ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-orange-100 text-orange-700 border border-orange-300'} text-[10px] sm:text-xs font-bold inline-flex items-center justify-center space-x-1 mx-auto transform transition-all duration-300 hover:scale-105">
                    <span>${hours < 2 ? '⚠️' : '⏱️'}</span>
                    <span>${hours < 2 ? 'Hurry! Sale ending soon!' : 'Limited time left!'}</span>
                </span>
            </div>` : ''}
        </div>
        `;
        
        // Update the countdown element
        // Display the countdown timer with more compact styling
        countdownElement.innerHTML = `
            <div class="flex items-center justify-center w-full">
                <div class="inline-flex items-center justify-between p-2 bg-red-50 rounded-lg border ${borderClass} shadow-md text-sm md:text-base space-x-2 transform transition-all duration-300 hover:scale-105">
                    <span class="font-bold text-red-700 px-1">${days}d</span>
                    <span class="text-red-500 font-bold">:</span>
                    <span class="font-bold text-red-700 px-1">${hours}h</span>
                    <span class="text-red-500 font-bold">:</span>
                    <span class="font-bold text-red-700 px-1">${minutes}m</span>
                    <span class="text-red-500 font-bold">:</span>
                    <span class="font-bold text-red-700 px-1">${seconds}s</span>
                </div>
            </div>
        `;
    }, 1000);
});