# 🌤️ Modern Weather Extension

A beautiful, feature-rich Chrome extension for weather information with overlay functionality and modern UI design.

## ✨ Features

- **🌍 Multi-City Weather**: Add and manage multiple cities
- **📍 Auto-Location**: Automatically detect your current location
- **🖼️ Overlay Mode**: Display weather overlay on any webpage
- **🎨 Modern UI**: Beautiful gradient design with smooth animations
- **⚡ Real-time Updates**: Live weather data with refresh functionality
- **🌡️ Temperature Units**: Toggle between Celsius and Fahrenheit
- **🔒 Secure API**: Multiple API key rotation for reliability
- **📱 Responsive Design**: Works perfectly on all screen sizes

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd weather-extension
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up API keys**
   - Get your free API key from [OpenWeatherMap](https://openweathermap.org/api)
   - Create a `.env` file in the root directory:
   ```env
   # Single API key
   OPEN_WEATHER_API_KEY=your_api_key_here
   
   # Or multiple keys for rotation (recommended)
   OPEN_WEATHER_API_KEYS=key1,key2,key3
   ```

4. **Build the extension**
   ```bash
   pnpm build
   ```

5. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## 🔧 Development

```bash
# Start development mode with hot reload
pnpm start

# Build for production
pnpm build
```

## 🛡️ Security Features

- **API Key Rotation**: Automatically rotates between multiple API keys
- **Secure Storage**: All data stored locally in Chrome storage
- **No External Dependencies**: Minimal external API calls
- **Privacy First**: No user data collection or tracking

## 🎨 Design Features

- **Glassmorphism Effects**: Modern blur and transparency effects
- **Smooth Animations**: Hover effects and transitions
- **Professional Color Scheme**: Beautiful gradients and shadows
- **Accessibility**: ARIA labels and focus states
- **Responsive Layout**: Adapts to different screen sizes

## 📁 Project Structure

```
src/
├── background/          # Background script for extension logic
├── components/          # Reusable React components
├── contentScript/       # Content script for overlay functionality
├── options/            # Extension options page
├── popup/              # Main popup interface
├── static/             # Static assets (icons, manifest)
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and API calls
```

## 🔄 API Key Management

The extension supports multiple API keys for better reliability:

```typescript
// In .env file
OPEN_WEATHER_API_KEYS=key1,key2,key3

// The extension automatically rotates between keys
```

## 🎯 Usage

1. **Add Cities**: Use the search bar to add your favorite cities
2. **Set Default**: Click "Set as Default" on any city card
3. **Auto-Location**: Use the location button to automatically set your current city
4. **Overlay Mode**: Toggle the overlay button to show weather on any webpage
5. **Temperature Units**: Click the temperature button to switch between °C and °F
6. **Refresh Data**: Use the refresh button to get the latest weather information

## 🐛 Troubleshooting

### Overlay Not Working
- Make sure you have a default location set
- Check that the webpage allows content scripts
- Try refreshing the page and toggling the overlay again

### API Errors
- Verify your API key is correct
- Check your internet connection
- Ensure you haven't exceeded API rate limits

### Extension Not Loading
- Check the Chrome console for errors
- Verify all files are in the correct locations
- Try reloading the extension

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Support

If you find this extension helpful, consider buying me a coffee! ☕

[Buy Me a Coffee](https://buymeacoffee.com/tanzimhossain)

---

**Made with ❤️ for the Chrome extension community**
