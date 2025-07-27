# Weather API Backend

A secure Next.js API backend for the Chrome Weather Extension. This backend acts as a proxy to the OpenWeather API, keeping your API keys secure.

## 🚀 Features

- **Secure API Key Management** - API keys are stored server-side only
- **CORS Enabled** - Works with Chrome extensions
- **Error Handling** - Comprehensive error responses
- **TypeScript** - Full type safety
- **Free Hosting** - Deploy to Vercel for free

## 📁 Project Structure

```
src/app/api/
├── weather/route.ts    # Weather data endpoint
└── geocode/route.ts    # Reverse geocoding endpoint
```

## 🔧 Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file:

```bash
# Copy the example file
cp env.example .env.local
```

Edit `.env.local` and add your OpenWeather API key:

```env
OPEN_WEATHER_API_KEY=your_actual_api_key_here
```

### 3. Development

```bash
pnpm dev
```

The API will be available at:
- `http://localhost:3000/api/weather`
- `http://localhost:3000/api/geocode`

## 🌐 API Endpoints

### GET /api/weather

Fetches weather data for a city.

**Parameters:**
- `city` (required): City name
- `units` (optional): `metric` or `imperial` (default: `metric`)

**Example:**
```
GET /api/weather?city=London&units=metric
```

**Response:**
```json
{
  "coord": { "lon": -0.13, "lat": 51.51 },
  "weather": [...],
  "main": {
    "temp": 15.5,
    "feels_like": 14.2,
    "humidity": 76
  },
  "name": "London"
}
```

### GET /api/geocode

Converts coordinates to city name.

**Parameters:**
- `lat` (required): Latitude
- `lon` (required): Longitude

**Example:**
```
GET /api/geocode?lat=51.51&lon=-0.13
```

**Response:**
```json
{
  "city": "London",
  "country": "GB",
  "state": "England"
}
```

## 🚀 Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy

```bash
vercel
```

### 3. Set Environment Variables

In your Vercel dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Add `OPEN_WEATHER_API_KEY` with your API key

### 4. Update Extension

After deployment, update your extension's `src/utils/api.ts`:

```typescript
const BACKEND_URL = 'https://your-project-name.vercel.app';
```

## 🔒 Security Features

- **API Key Protection** - Keys never exposed to client
- **CORS Headers** - Properly configured for Chrome extensions
- **Error Handling** - No sensitive data in error responses
- **Input Validation** - All parameters validated

## 🧪 Testing

### Test Weather Endpoint

```bash
curl "http://localhost:3000/api/weather?city=London&units=metric"
```

### Test Geocoding Endpoint

```bash
curl "http://localhost:3000/api/geocode?lat=51.51&lon=-0.13"
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPEN_WEATHER_API_KEY` | Your OpenWeather API key | Yes |

## 🛠️ Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Adding New Endpoints

1. Create a new folder in `src/app/api/`
2. Add a `route.ts` file
3. Export HTTP methods (GET, POST, etc.)

Example:
```typescript
// src/app/api/example/route.ts
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({ message: 'Hello!' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure CORS headers are set correctly
2. **API Key Not Found**: Check your `.env.local` file
3. **Deployment Issues**: Verify environment variables in Vercel

### Debug Mode

Add this to see detailed logs:

```typescript
console.log('Request URL:', request.url);
console.log('Search params:', searchParams);
```

## 📄 License

MIT License - feel free to use this for your own projects!
