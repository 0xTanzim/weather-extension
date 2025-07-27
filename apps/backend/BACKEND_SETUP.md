# 🌤️ Weather Extension Backend Setup

Complete guide to set up a secure backend for your Chrome Weather Extension.

## 📁 Project Structure

```
build_test/
├── src/                    # Chrome Extension
│   ├── utils/
│   │   └── api.ts         # Updated to use backend
│   └── ...
└── server/
    └── weather-api/        # Next.js Backend
        ├── src/app/api/
        │   ├── weather/route.ts
        │   └── geocode/route.ts
        ├── env.example
        ├── DEPLOYMENT.md
        └── README.md
```

## 🚀 Quick Start

### 1. Setup Backend

```bash
cd server/weather-api

# Install dependencies
pnpm install

# Create environment file
cp env.example .env.local

# Edit .env.local and add your OpenWeather API key
# OPEN_WEATHER_API_KEY=your_api_key_here

# Start development server
pnpm dev
```

### 2. Test Backend

```bash
# Test the API endpoints
pnpm test

# Or manually test:
curl "http://localhost:3000/api/weather?city=London&units=metric"
curl "http://localhost:3000/api/geocode?lat=51.51&lon=-0.13"
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel

# Set environment variables in Vercel dashboard
# OPEN_WEATHER_API_KEY=your_api_key_here

# Redeploy
vercel --prod
```

### 4. Update Extension

Edit `src/utils/api.ts`:
```typescript
const BACKEND_URL = 'https://your-vercel-url.vercel.app';
```

### 5. Rebuild Extension

```bash
cd ../..  # Back to extension root
pnpm build
```

## 🔒 Security Benefits

✅ **API Keys Protected** - Never exposed to client  
✅ **CORS Configured** - Works with Chrome extensions  
✅ **Error Handling** - No sensitive data in errors  
✅ **Input Validation** - All parameters validated  
✅ **Free Hosting** - Vercel handles everything  

## 🌐 API Endpoints

### Weather Data
```
GET /api/weather?city=London&units=metric
```

### Geocoding
```
GET /api/geocode?lat=51.51&lon=-0.13
```

## 📋 Deployment Checklist

- [ ] Backend deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Backend URL updated in extension
- [ ] Extension rebuilt and tested
- [ ] Chrome Web Store ready!

## 🎯 Why This Solution?

### ✅ **Perfect for Chrome Extensions**
- CORS headers configured for extensions
- Simple REST API endpoints
- TypeScript support

### ✅ **Free Forever**
- Vercel free tier is generous
- No credit card required
- Automatic scaling

### ✅ **Secure by Design**
- API keys server-side only
- No client-side secrets
- Safe for public distribution

### ✅ **Easy to Maintain**
- Next.js is well-documented
- Vercel handles deployment
- Built-in monitoring

## 🔧 Troubleshooting

### Backend Issues
1. **API Key Not Working**
   - Check `.env.local` file
   - Verify API key in Vercel dashboard
   - Test API key directly with OpenWeather

2. **CORS Errors**
   - Check backend URL in extension
   - Verify CORS headers in API routes
   - Check browser console for errors

3. **Deployment Issues**
   - Check Vercel logs: `vercel logs`
   - Verify environment variables
   - Test locally first

### Extension Issues
1. **Weather Not Loading**
   - Check backend URL in `api.ts`
   - Verify network requests in DevTools
   - Test backend endpoints directly

2. **Geolocation Not Working**
   - Check browser permissions
   - Verify geocoding endpoint
   - Test with known coordinates

## 📚 Resources

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Vercel Deployment](https://vercel.com/docs)
- [OpenWeather API](https://openweathermap.org/api)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)

## 🎉 Success!

Once everything is working:

1. **Your API keys are secure** ✅
2. **Your extension works perfectly** ✅  
3. **You can publish to Chrome Web Store** ✅
4. **Everything is free forever** ✅

## 🚀 Next Steps

1. **Deploy backend to Vercel**
2. **Update extension with backend URL**
3. **Test everything thoroughly**
4. **Publish to Chrome Web Store**
5. **Monitor usage and performance**

---

**Need help?** Check the detailed guides in `server/weather-api/README.md` and `server/weather-api/DEPLOYMENT.md` 