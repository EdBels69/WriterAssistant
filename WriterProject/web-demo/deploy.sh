#!/bin/bash

# Script for building and deploying to GitHub Pages

echo "🚀 Building the application..."

# Build the application
npm run build

echo "✅ Build completed!"
echo "📦 The built files are in the 'dist' directory"
echo ""
echo "📋 Next steps for deployment:"
echo "1. Commit and push the changes to GitHub"
echo "2. Enable GitHub Pages in repository settings"
echo "3. Set build directory to 'dist'"
echo "4. Your app will be available at: https://[your-username].github.io/WriterAssistant/"
echo ""
echo "💡 For backend deployment, consider using:"
echo "- Railway.app"
echo "- Render.com" 
echo "- Heroku"
echo "- DigitalOcean App Platform"