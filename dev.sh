#!/bin/bash

echo "🚀 Starting Weather Extension Monorepo Development..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Check if backend environment file exists
if [ ! -f "apps/backend/.env.local" ]; then
    echo "⚠️  Backend environment file not found."
    echo "📝 Creating apps/backend/.env.local from template..."
    cp apps/backend/env.example apps/backend/.env.local
    echo "🔑 Please edit apps/backend/.env.local and add your OpenWeather API key"
    echo "   OPEN_WEATHER_API_KEY=your_api_key_here"
fi

echo "🔧 Starting development servers..."
echo "   - Backend: http://localhost:3000"
echo "   - Extension: Build to apps/extension/dist/"
echo ""
echo "📋 Available commands:"
echo "   pnpm dev              # Start both apps"
echo "   pnpm extension:dev    # Extension only"
echo "   pnpm backend:dev      # Backend only"
echo "   pnpm build            # Build both apps"
echo "   pnpm test             # Run tests"
echo ""

# Start both apps in development mode
pnpm dev
