#!/bin/bash

# Banking Transactions API - Demo Runner
echo "==================================="
echo "  Banking Transactions API Demo"
echo "==================================="

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the application
echo "Starting the Banking API..."
npm start
