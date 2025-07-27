# 🌤️ Weather Extension Monorepo

A modern Chrome extension with a secure backend API, built with **Turborepo** for optimal development experience.

## 📁 Project Structure

```
weather-extension-monorepo/
├── apps/
│   ├── extension/          # Chrome Extension
│   │   ├── src/
│   │   │   ├── background/
│   │   │   ├── components/
│   │   │   ├── contentScript/
│   │   │   ├── options/
│   │   │   ├── popup/
│   │   │   ├── static/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── webpack.*.js
│   │   └── package.json
│   └── backend/            # Next.js API Server
│       ├── src/app/api/
│       │   ├── weather/route.ts
│       │   └── geocode/route.ts
│       ├── src/middleware.ts
│       ├── env.example
│       ├── SECURITY.md
│       ├── test-api.js
│       └── package.json
├── turbo.json
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/backend/env.example apps/backend/.env.local
# Edit apps/backend/.env.local and add your OpenWeather API key
```

### Development

```bash
# Start both extension and backend in development mode
pnpm dev

# Or start them individually:
pnpm extension:dev    # Extension development
pnpm backend:dev      # Backend development
```

### Building

```bash
# Build both apps
pnpm build

# Or build individually:
pnpm extension:build  # Build extension
pnpm backend:build    # Build backend
```

## 🛠️ Available Scripts

### Root Level (Monorepo)

```bash
pnpm dev              # Start all apps in development
pnpm build            # Build all apps
pnpm lint             # Lint all apps
pnpm clean            # Clean all builds
pnpm test             # Run all tests
pnpm format           # Format all code
```

### Extension Specific

```bash
pnpm extension:dev    # Start extension development
pnpm extension:build  # Build extension
```

### Backend Specific

```bash
pnpm backend:dev      # Start backend development
pnpm backend:build    # Build backend
```

## 🔧 Development Workflow

### 1. Extension Development

```bash
cd apps/extension
pnpm dev              # Start webpack in watch mode
```

The extension will be built to `apps/extension/dist/`. Load this folder in Chrome:

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `apps/extension/dist/`

### 2. Backend Development

```bash
cd apps/backend
pnpm dev              # Start Next.js development server
```

The API will be available at:

- `http://localhost:3000/api/weather`
- `http://localhost:3000/api/geocode`

### 3. Testing

```bash
# Test backend API
cd apps/backend
pnpm test

# Test extension (after building)
cd apps/extension
pnpm build
# Then load in Chrome and test manually
```

## 🔒 Security Features

### Backend Security

- ✅ **Rate limiting**: 60 requests/minute per IP
- ✅ **Input validation**: Malicious character filtering
- ✅ **Request timeout**: 10-second protection
- ✅ **Security headers**: XSS, clickjacking protection
- ✅ **CORS configuration**: Chrome extension support
- ✅ **Error hiding**: No sensitive data exposed

### Extension Security

- ✅ **Input validation**: City names and coordinates
- ✅ **Request timeout**: 10-second protection
- ✅ **Retry logic**: Exponential backoff
- ✅ **Response validation**: Structure checking
- ✅ **Error handling**: User-friendly messages

## 🌐 API Endpoints

### Weather Data

```
GET /api/weather?city=London&units=metric
```

### Geocoding

```
GET /api/geocode?lat=51.51&lon=-0.13
```

## 🚀 Deployment

### Backend (Vercel)

```bash
cd apps/backend
vercel login
vercel
# Set OPEN_WEATHER_API_KEY in Vercel dashboard
vercel --prod
```

### Extension (Chrome Web Store)

1. Build the extension: `pnpm extension:build`
2. Zip the `apps/extension/dist/` folder
3. Upload to Chrome Web Store

## 📋 Environment Variables

### Backend (.env.local)

```env
OPEN_WEATHER_API_KEY=your_openweather_api_key_here
```

## 🧪 Testing

### Backend Tests

```bash
cd apps/backend
pnpm test
```

Tests include:

- ✅ Basic functionality
- ✅ Rate limiting
- ✅ Input validation
- ✅ Malicious input blocking
- ✅ Large input rejection
- ✅ Invalid coordinates
- ✅ Timeout protection

### Extension Testing

1. Build: `pnpm extension:build`
2. Load in Chrome
3. Test all features manually

## 🔧 Configuration

### Turborepo Configuration

- **Caching**: Enabled for all builds
- **Parallel execution**: All tasks run in parallel
- **Dependencies**: Proper task dependencies configured

### Webpack Configuration

- **Development**: Hot reloading enabled
- **Production**: Optimized builds
- **Environment variables**: Properly injected

### Next.js Configuration

- **API routes**: Properly configured
- **Middleware**: Security middleware enabled
- **Environment variables**: Server-side only

## 📚 Documentation

- `apps/backend/SECURITY.md` - Comprehensive security guide
- `apps/backend/README.md` - Backend documentation
- `apps/backend/DEPLOYMENT.md` - Deployment guide

## 🎯 Benefits of Monorepo

### ✅ **Unified Development**

- Single command to start all services
- Shared tooling and configurations
- Consistent development experience

### ✅ **Efficient Building**

- Turborepo caching for faster builds
- Parallel execution of tasks
- Incremental builds

### ✅ **Code Sharing**

- Shared types and utilities
- Consistent code style
- Unified testing strategy

### ✅ **Deployment**

- Coordinated deployments
- Shared environment variables
- Unified CI/CD pipeline

## 🆘 Troubleshooting

### Common Issues

1. **Extension not loading**
   - Check webpack build output
   - Verify manifest.json is copied
   - Check Chrome extension errors

2. **Backend not starting**
   - Check environment variables
   - Verify API key is set
   - Check port 3000 is available

3. **Build failures**
   - Run `pnpm clean` to clear cache
   - Check TypeScript errors
   - Verify all dependencies installed

### Development Tips

1. **Use Turborepo commands**

   ```bash
   pnpm dev              # Start all apps
   pnpm build            # Build all apps
   pnpm lint             # Lint all code
   ```

2. **Monitor logs**
   - Backend: Check terminal for API logs
   - Extension: Check Chrome DevTools console

3. **Hot reloading**
   - Backend: Automatic with Next.js
   - Extension: Manual reload in Chrome

## 🎉 Success

Your weather extension is now organized in a **professional monorepo** with:

- ✅ **Turborepo** for efficient development
- ✅ **Chrome Extension** with modern tooling
- ✅ **Secure Backend API** with comprehensive security
- ✅ **Unified development** experience
- ✅ **Production ready** for deployment

**Ready for Chrome Web Store publication!** 🚀
