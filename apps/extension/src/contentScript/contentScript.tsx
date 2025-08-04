import { createRoot } from 'react-dom/client';

import { Messages } from '../utils/messages';
import { getStoredOptions } from '../utils/storage';
import WeatherCard from '../v2/components/WeatherCard';

import './contentScript.css';

// Global overlay state
let overlayVisible = false;
let overlayElement: HTMLElement | null = null;
let overlayRoot: any = null; // Store React root for cleanup
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

// Clean up event listeners
function cleanupEventListeners() {
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDrag);
}

// Draggable overlay functionality
function makeDraggable(element: HTMLElement) {
  // Remove existing event listeners to prevent duplicates
  const header = element.querySelector('.drag-handle') as HTMLElement;
  if (!header) {
    console.log('No drag handle found');
    return;
  }

  // Clean up existing listeners
  cleanupEventListeners();
  header.removeEventListener('mousedown', startDrag);

  header.style.cursor = 'grab';
  header.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);

  console.log('Draggable functionality attached');
}

// Close overlay function with proper cleanup
function closeOverlay() {
  if (overlayElement) {
    // Clean up event listeners
    cleanupEventListeners();
    const header = overlayElement.querySelector('.drag-handle') as HTMLElement;
    if (header) {
      header.removeEventListener('mousedown', startDrag);
    }

    // Clean up React root to prevent memory leaks
    if (overlayRoot) {
      try {
        overlayRoot.unmount();
      } catch (error) {
        console.warn('Error unmounting React root:', error);
      }
      overlayRoot = null;
    }

    // Remove DOM element
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

            // Detect dark/light mode
            const isDarkMode = window.matchMedia(
              '(prefers-color-scheme: dark)'
            ).matches;
            const prefersDark = window.matchMedia(
              '(prefers-color-scheme: dark)'
            ).matches;
            const prefersLight = window.matchMedia(
              '(prefers-color-scheme: light)'
            ).matches;

            // Determine theme based on user preference and page background
            const pageBackground = getComputedStyle(
              document.body
            ).backgroundColor;
            const isPageDark = isDarkBackground(pageBackground);
            const theme =
              prefersDark || (isPageDark && !prefersLight) ? 'dark' : 'light';

            // Create overlay element with improved sizing
            overlayElement = document.createElement('div');
            overlayElement.id = 'weather-overlay';
            overlayElement.className = 'overlayCard';
            overlayElement.setAttribute('data-theme', theme);
            overlayElement.style.position = 'fixed';
            overlayElement.style.top = '20px';
            overlayElement.style.right = '20px';
            overlayElement.style.zIndex = '9999';
            overlayElement.style.width = '320px'; // Increased from 240px
            overlayElement.style.minHeight = '280px'; // Added minimum height
            overlayElement.style.maxHeight = '400px'; // Added maximum height
            overlayElement.style.overflow = 'hidden';

            // Theme-based styling
            if (theme === 'dark') {
              overlayElement.style.background =
                'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)';
              overlayElement.style.color = '#ffffff';
              overlayElement.style.border =
                '1px solid rgba(255, 255, 255, 0.2)';
            } else {
              overlayElement.style.background =
                'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)';
              overlayElement.style.color = '#1e293b';
              overlayElement.style.border = '1px solid rgba(0, 0, 0, 0.1)';
            }

            overlayElement.style.borderRadius = '16px';
            overlayElement.style.boxShadow =
              theme === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3)'
                : '0 8px 32px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)';
            overlayElement.style.backdropFilter = 'blur(20px)';
            overlayElement.style.fontFamily =
              "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
            overlayElement.style.fontSize = '14px';
            overlayElement.style.lineHeight = '1.5';

            document.body.appendChild(overlayElement);

            // Create React root and store reference for cleanup
            overlayRoot = createRoot(overlayElement);
            overlayRoot.render(
              <div
                className={`p-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
              >
                <div className="flex justify-between items-center mb-3 drag-handle">
                  <h3
                    className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                  >
                    🌤️ Weather
                  </h3>
                  <button
                    onClick={closeOverlay}
                    className={`${theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'} transition-colors duration-200 hover:scale-110 p-1`}
                    title="Close overlay"
                    style={{ zIndex: 10001 }}
                  >
                    <svg
                      className="w-5 h-5"
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
                  theme={theme}
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

// Helper function to detect dark background
function isDarkBackground(backgroundColor: string): boolean {
  // Convert background color to RGB values
  const rgb = backgroundColor.match(/\d+/g);
  if (!rgb || rgb.length < 3) return false;

  const r = parseInt(rgb[0]);
  const g = parseInt(rgb[1]);
  const b = parseInt(rgb[2]);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.5;
}

// Clean up when content script is unloaded
window.addEventListener('beforeunload', () => {
  closeOverlay();
});
