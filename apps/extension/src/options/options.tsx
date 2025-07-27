import {
  Box,
  Button,
  Card,
  CardContent,
  Switch,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Stack,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  getStoredOptions,
  LocalStorageOptions,
  setStoreOptions,
} from '../utils/storage';
import './options.css';

type FormState = 'ready' | 'saving';

const OptionApp: React.FC<{}> = () => {
  const [options, setOptions] = useState<LocalStorageOptions | null>(null);
  const [formState, setFormState] = useState<FormState>('ready');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    getStoredOptions().then((options) => setOptions(options));
  }, []);

  const handleHomeCityChange = (homeCity: string) => {
    if (!options) return;
    if (homeCity.length > 50) {
      console.warn('Home city name is too long. Please shorten it.');
      return;
    }

    setOptions({
      ...options,
      homeCity,
    });
  };

  const handleAutoOverlayChange = (hasAutoOverlay: boolean) => {
    if (!options) return;
    setOptions({
      ...options,
      hasAutoOverlay,
    });
  };

  const handleSaveButtonClick = () => {
    if (!options) return;
    
    setFormState('saving');
    setStoreOptions(options).then(() => {
      setFormState('ready');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }).catch((error) => {
      console.error('Error saving options:', error);
      setFormState('ready');
    });
  };

  if (!options) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ color: 'white' }}>
          Loading options...
        </Typography>
      </Box>
    );
  }

  const isFieldsDisabled = formState === 'saving';

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 4,
      px: 2
    }}>
      <Box maxWidth="700px" mx="auto">
        <Card elevation={12} sx={{ 
          borderRadius: 4, 
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <CardContent sx={{ p: 5 }}>
            <Typography variant="h3" gutterBottom sx={{ 
              fontWeight: 700, 
              color: '#2c3e50',
              mb: 4,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ⚙️ Weather Extension Settings
            </Typography>

            <Stack spacing={4}>
              <Box>
                <Typography variant="h5" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
                  📍 Default Location
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  This will be used as your default weather location and displayed in the overlay
                </Typography>
                <TextField
                  placeholder="Enter your home city (e.g., New York, London, Tokyo)"
                  label="Home City"
                  fullWidth
                  variant="outlined"
                  value={options.homeCity}
                  onChange={(e) => handleHomeCityChange(e.target.value)}
                  disabled={isFieldsDisabled}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    }
                  }}
                />
              </Box>

              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h5" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
                      🖼️ Auto Overlay
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Automatically show weather overlay when visiting web pages
                    </Typography>
                  </Box>
                  <Switch
                    color="primary"
                    checked={options.hasAutoOverlay}
                    onChange={(e) => handleAutoOverlayChange(e.target.checked)}
                    disabled={isFieldsDisabled}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#667eea',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#667eea',
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ textAlign: 'center', pt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleSaveButtonClick}
                  disabled={isFieldsDisabled}
                  sx={{ 
                    px: 6, 
                    py: 2, 
                    borderRadius: 3,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                    },
                    '&:disabled': {
                      opacity: 0.6,
                    }
                  }}
                >
                  {isFieldsDisabled ? '💾 Saving...' : '💾 Save Settings'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success" 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#4CAF50',
            }
          }}
        >
          ✅ Settings saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

const container = document.getElementById('root') || document.createElement('div');
if (!container.id) {
  container.id = 'root';
  document.body.appendChild(container);
}
const root = createRoot(container);
root.render(<OptionApp />);
