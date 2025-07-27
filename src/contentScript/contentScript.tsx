import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton, Typography } from '@mui/material';
import React, { useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import WeatherCard from '../components/WeatherCard';
import { Messages } from '../utils/messages';
import { getStoredOptions, LocalStorageOptions } from '../utils/storage';

import './contentScript.css';

const OVERLAY_ID = 'weather-extension-overlay';

const Overlay: React.FC<{
  options: LocalStorageOptions;
  onClose: () => void;
}> = ({ options, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.drag-handle')) {
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current && overlayRef.current) {
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        
        const rect = overlayRef.current.getBoundingClientRect();
        const newLeft = rect.left + deltaX;
        const newTop = rect.top + deltaY;
        
        overlayRef.current.style.left = `${newLeft}px`;
        overlayRef.current.style.top = `${newTop}px`;
        
        dragStart.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!options.homeCity) {
    return (
      <div className="overlayCard" ref={overlayRef}>
        <Box p={2} textAlign="center">
          <Typography variant="h6" color="inherit">Set your default location in extension options.</Typography>
        </Box>
      </div>
    );
  }

  return (
    <div className="overlayCard" ref={overlayRef}>
      <Box display="flex" justifyContent="space-between" alignItems="center" px={1} className="drag-handle">
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" color="inherit" sx={{ opacity: 0.8 }}>
            Drag to move
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Close overlay">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <WeatherCard
        city={options.homeCity}
        tempScale={options.tempScale}
        onDelete={onClose}
        overlayMode
      />
    </div>
  );
};

function mountOverlay(options: LocalStorageOptions) {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) return;

  const rootDiv = document.createElement('div');
  rootDiv.id = OVERLAY_ID;
  document.body.appendChild(rootDiv);

  const root = createRoot(rootDiv);
  root.render(
    <Overlay
      options={options}
      onClose={() => {
        root.unmount();
        rootDiv.remove();
      }}
    />
  );
}

function removeOverlay() {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    const root = createRoot(existing);
    root.unmount();
    existing.remove();
  }
}

function setupListener() {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log('Content script received message:', msg);
    if (msg === Messages.TOGGLE_OVERLAY) {
      const existing = document.getElementById(OVERLAY_ID);
      if (existing) {
        removeOverlay();
        sendResponse({ success: true, action: 'removed' });
      } else {
        getStoredOptions().then((options) => {
          if (options && options.homeCity) {
            mountOverlay(options);
            sendResponse({ success: true, action: 'mounted' });
          } else {
            sendResponse({ success: false, error: 'No home city set' });
          }
        }).catch((error) => {
          console.error('Error getting options:', error);
          sendResponse({ success: false, error: 'Failed to get options' });
        });
      }
      return true; // Keep the message channel open for async response
    }
  });
}

// Only run script if content script is injected properly
getStoredOptions()
  .then((options) => {
    if (options?.hasAutoOverlay && options.homeCity) {
      mountOverlay(options);
    }
  })
  .catch(console.error);

setupListener();
