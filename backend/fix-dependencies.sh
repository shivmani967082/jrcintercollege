#!/bin/bash

# Script to fix MongoDB dependencies
# Usage: ./fix-dependencies.sh

echo "🔧 Fixing MongoDB dependencies..."

# Remove node_modules and package-lock.json
echo "📦 Cleaning up old dependencies..."
rm -rf node_modules package-lock.json

# Install missing dependency
echo "📥 Installing @mongodb-js/saslprep..."
npm install @mongodb-js/saslprep

# Reinstall all dependencies
echo "📥 Reinstalling all dependencies..."
npm install

echo "✅ Dependencies fixed!"
echo ""
echo "Now you can start the server with:"
echo "  npm run dev"
