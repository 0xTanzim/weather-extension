# 🚀 Deploy to Vercel - Step by Step Guide

## Prerequisites

1. **GitHub Account** - You'll need this to connect to Vercel
2. **OpenWeather API Key** - Get one from [OpenWeatherMap](https://openweathermap.org/api)
3. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)

## Step 1: Prepare Your Backend

### 1.1 Create Environment File

```bash
cd server/weather-api
cp env.example .env.local
```

Edit `.env.local` and add your API key:
```env
OPEN_WEATHER_API_KEY=your_actual_api_key_here
```

### 1.2 Test Locally

```bash
pnpm dev
```

Test the endpoints:
```bash
curl "http://localhost:3000/api/weather?city=London&units=metric"
curl "http://localhost:3000/api/geocode?lat=51.51&lon=-0.13"
```

## Step 2: Deploy to Vercel

### 2.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 2.2 Login to Vercel

```bash
vercel login
```

### 2.3 Deploy

```bash
cd server/weather-api
vercel
```

Follow the prompts:
- **Set up and deploy?** → `Y`
- **Which scope?** → Select your account
- **Link to existing project?** → `N`
- **What's your project's name?** → `weather-api` (or any name)
- **In which directory is your code located?** → `./` (current directory)
- **Want to override the settings?** → `N`

### 2.4 Set Environment Variables

After deployment, go to your Vercel dashboard:

1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name**: `OPEN_WEATHER_API_KEY`
   - **Value**: Your OpenWeather API key
   - **Environment**: Production (and Preview if you want)
5. Click **Save**

### 2.5 Redeploy

```bash
vercel --prod
```

## Step 3: Update Your Extension

### 3.1 Get Your Backend URL

After deployment, Vercel will give you a URL like:
```
https://weather-api-abc123.vercel.app
```

### 3.2 Update Extension Code

Edit `src/utils/api.ts` in your extension:

```typescript
// Replace this line:
const BACKEND_URL = 'https://your-weather-api.vercel.app';

// With your actual URL:
const BACKEND_URL = 'https://weather-api-abc123.vercel.app';
```

### 3.3 Rebuild Extension

```bash
cd ../../  # Go back to extension root
pnpm build
```

## Step 4: Test Everything

### 4.1 Test Backend

```bash
curl "https://your-backend-url.vercel.app/api/weather?city=London&units=metric"
```

### 4.2 Test Extension

1. Load your extension in Chrome
2. Open the popup
3. Add a city
4. Check if weather data loads

## 🔧 Troubleshooting

### Backend Not Working

1. **Check Environment Variables**
   ```bash
   # In Vercel dashboard, verify OPEN_WEATHER_API_KEY is set
   ```

2. **Check Logs**
   ```bash
   vercel logs
   ```

3. **Test API Key**
   ```bash
   curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY"
   ```

### Extension Not Working

1. **Check CORS**
   - Make sure your backend URL is correct
   - Check browser console for CORS errors

2. **Check Network**
   - Open Chrome DevTools
   - Go to Network tab
   - Try adding a city
   - Look for failed requests

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check API key in Vercel environment variables |
| CORS Error | Backend URL incorrect in extension |
| 404 Not Found | Check API endpoint paths |
| 500 Server Error | Check Vercel logs for details |

## 🎉 Success!

Once everything works:

1. ✅ Your API keys are secure (server-side only)
2. ✅ Your extension works with the backend
3. ✅ You can publish to Chrome Web Store safely
4. ✅ Everything is free forever!

## 📝 Next Steps

1. **Publish to Chrome Web Store**
2. **Monitor Usage** - Check Vercel analytics
3. **Scale if Needed** - Vercel handles this automatically

## 💡 Pro Tips

- **Custom Domain**: You can add a custom domain in Vercel settings
- **Multiple Environments**: Use different API keys for dev/prod
- **Monitoring**: Vercel provides built-in analytics
- **Backups**: Your code is automatically backed up in Git

## 🆘 Need Help?

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **OpenWeather API**: [openweathermap.org/api](https://openweathermap.org/api) 