import React, { useEffect, useState } from 'react';

import { Card } from '@mui/material';
import { createRoot } from 'react-dom/client';
import WeatherCard from '../components/WeatherCard';
import { Messages } from '../utils/messages';
import { getStoredOptions, LocalStorageOptions } from '../utils/storage';
import './contentScript.css';

const App: React.FC<{}> = () => {
  const [options, setOptions] = useState<LocalStorageOptions | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    getStoredOptions().then((options) => {
      setOptions(options);

      setIsActive(options?.hasAutoOverlay);
    });
  }, []);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg === Messages.TOGGLE_OVERLAY) {
        setIsActive((prev) => !prev);
        // if (!isActive) {
        //   getStoredOptions().then((options) => {
        //     setOptions(options);
        //   });
        // } else {
        //   setOptions(null);
        // }
      }
    });
  }, [isActive]);

  return (
    <>
      {isActive && options && (
        <Card className="overlayCard">
          <WeatherCard
            city={options?.homeCity}
            tempScale={options?.tempScale}
            onDelete={() => {
              setIsActive(false);
            }}
          />
        </Card>
      )}
    </>
  );
};

const rootDiv = document.createElement('div');
document.body.appendChild(rootDiv);

const root = createRoot(rootDiv);
root.render(<App />);
