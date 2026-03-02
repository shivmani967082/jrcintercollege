#!/bin/bash

# Script to start MongoDB
# Usage: ./start-mongodb.sh

echo "🚀 Starting MongoDB..."

# Check if MongoDB is already running
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB is already running"
    exit 0
fi

# Try to start MongoDB
if command -v mongod &> /dev/null; then
    # Create data directory if it doesn't exist
    mkdir -p ~/data/db
    
    # Start MongoDB in background
    mongod --dbpath ~/data/db > /dev/null 2>&1 &
    
    # Wait a moment for MongoDB to start
    sleep 2
    
    # Check if MongoDB started successfully
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB started successfully"
        echo "📊 MongoDB is running on mongodb://localhost:27017"
    else
        echo "❌ Failed to start MongoDB"
        echo "💡 Try running manually: mongod --dbpath ~/data/db"
        exit 1
    fi
else
    echo "❌ MongoDB not found in PATH"
    echo "💡 Please install MongoDB first:"
    echo "   brew install mongodb-community"
    echo "   OR"
    echo "   Download from https://www.mongodb.com/try/download/community"
    exit 1
fi
