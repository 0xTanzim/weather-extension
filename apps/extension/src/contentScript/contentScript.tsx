import { createRoot } from 'react-dom/client';

import { Messages } from '../utils/messages';
import { getStoredOptions } from '../utils/storage';
import WeatherCard from '../v2/components/WeatherCard';

import './contentScript.css';

// Global overlay state
let overlayVisible = false;
let overlayElement: HTMLElement | null = null;
let isDragging = false;
let dragStart = { x: 0, y: 0 };

// Drag event handlers
function startDrag(e: MouseEvent) {
  console.log('Drag started');
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
  const header = e.target as HTMLElement;
  header.style.cursor = 'grabbing';
  e.preventDefault();
}

function drag(e: MouseEvent) {
  if (!isDragging || !overlayElement) return;

  const deltaX = e.clientX - dragStart.x;
  const deltaY = e.clientY - dragStart.y;

  const rect = overlayElement.getBoundingClientRect();
  const newLeft = rect.left + deltaX;
  const newTop = rect.top + deltaY;

  // Keep overlay within viewport bounds
  const maxX = window.innerWidth - rect.width;
  const maxY = window.innerHeight - rect.height;

  overlayElement.style.left = `${Math.max(0, Math.min(newLeft, maxX))}px`;
  overlayElement.style.top = `${Math.max(0, Math.min(newTop, maxY))}px`;

  dragStart = { x: e.clientX, y: e.clientY };
}

function stopDrag() {
  console.log('Drag stopped');
  isDragging = false;
  if (overlayElement) {
    const header = overlayElement.querySelector('.drag-handle') as HTMLElement;
    if (header) {
      header.style.cursor = 'grab';
    }
  }
}

// Draggable overlay functionality
function makeDraggable(element: HTMLElement) {
  // Remove existing event listeners to prevent duplicates
  const header = element.querySelector('.drag-handle') as HTMLElement;
  if (!header) {
    console.log('No drag handle found');
    return;
  }

  // Remove existing listeners
  header.removeEventListener('mousedown', startDrag);
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDrag);

  header.style.cursor = 'grab';
  header.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);

  console.log('Draggable functionality attached');
}

// Close overlay function
function closeOverlay() {
  if (overlayElement) {
    // Remove event listeners before removing element
    const header = overlayElement.querySelector('.drag-handle') as HTMLElement;
    if (header) {
      header.removeEventListener('mousedown', startDrag);
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
    }
    overlayElement.remove();
    overlayElement = null;
  }
  overlayVisible = false;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request === Messages.TOGGLE_OVERLAY) {
    if (overlayVisible) {
      // Remove overlay
      closeOverlay();
      sendResponse({ success: true, action: 'removed' });
    } else {
      // Create overlay
      getStoredOptions()
        .then((options) => {
          if (options && options.homeCity) {
            // Remove existing overlay if any
            if (overlayElement) {
              closeOverlay();
            }

            // Create overlay element
            overlayElement = document.createElement('div');
            overlayElement.id = 'weather-overlay';
            overlayElement.className = 'overlayCard';
            overlayElement.style.position = 'fixed';
            overlayElement.style.top = '20px';
            overlayElement.style.right = '20px';
            overlayElement.style.zIndex = '9999';
            overlayElement.style.width = '240px';
            overlayElement.style.background =
              'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)';
            overlayElement.style.borderRadius = '12px';
            overlayElement.style.boxShadow =
              '0 8px 32px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)';
            overlayElement.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            overlayElement.style.backdropFilter = 'blur(20px)';
            overlayElement.style.fontFamily = "'Poppins', sans-serif";
            document.body.appendChild(overlayElement);

            const root = createRoot(overlayElement);
            root.render(
              <div className="p-3 text-white">
                <div className="flex justify-between items-center mb-2 drag-handle">
                  <h3 className="text-sm font-semibold text-shadow-sm">
                    🌤️ Weather
                  </h3>
                  <button
                    onClick={closeOverlay}
                    className="text-red-400 hover:text-red-300 transition-colors duration-200 hover:scale-110"
                    title="Close overlay"
                    style={{ zIndex: 10001 }}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <WeatherCard
                  city={options.homeCity}
                  tempScale={options.tempScale}
                  overlayMode={true}
                />
              </div>
            );

            // Make overlay draggable with a longer delay to ensure DOM is ready
            setTimeout(() => {
              if (overlayElement) {
                makeDraggable(overlayElement);
              }
            }, 200);

            overlayVisible = true;
            sendResponse({ success: true, action: 'mounted' });
          } else {
            sendResponse({ success: false, error: 'No home city set' });
          }
        })
        .catch((error) => {
          console.error('Error getting options:', error);
          sendResponse({ success: false, error: 'Failed to get options' });
        });
    }
  }
  return true; // Keep the message channel open for async response
});
