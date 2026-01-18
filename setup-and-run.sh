#!/bin/bash

# Hospital Patient Monitoring Simulator - Setup and Run Script

echo "================================================"
echo "Hospital Patient Monitoring Simulator"
echo "Setup and Installation Script"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js version 18+ is recommended. You have: $(node -v)"
fi

echo "✅ Node.js detected: $(node -v)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm detected: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo ""
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to install dependencies."
    exit 1
fi

echo ""
echo "================================================"
echo "✅ Installation Complete!"
echo "================================================"
echo ""
echo "🚀 Starting development server..."
echo ""
echo "📋 Important Notes:"
echo "   • Use Chrome, Edge, or Opera browser"
echo "   • Web Serial API requires HTTPS or localhost"
echo "   • Connect Arduino Mega via USB before testing"
echo ""
echo "   The app will open at: http://localhost:3000"
echo ""
echo "================================================"
echo ""

# Start development server
npm run dev

