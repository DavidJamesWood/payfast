#!/bin/bash

# PayFast Demo Runner
# This script runs the complete demo flow and generates a beautiful report

set -e

echo "🎬 PayFast Demo Runner"
echo "======================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "../docker-compose.yml" ]; then
    print_error "Please run this script from the demo/ directory"
    exit 1
fi

# Create necessary directories
print_status "Creating demo directories..."
mkdir -p screenshots reports

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing Playwright dependencies..."
    npm install
    npx playwright install chromium
fi

# Start the application
print_status "Starting PayFast application..."
cd ..
docker compose up -d web api db
cd demo

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if services are running
if ! curl -s http://localhost:5173 > /dev/null; then
    print_error "Web service is not responding"
    exit 1
fi

if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    print_warning "API health check failed, but continuing..."
fi

# Run the demo
print_status "Running Playwright demo..."
if npx playwright test simple-demo.spec.ts --project=chromium; then
    print_success "Demo completed successfully!"
else
    print_error "Demo failed to complete"
    exit 1
fi

# Generate HTML report
print_status "Generating HTML report..."
node generate-report.js

# Show results
print_success "Demo completed! 🎉"
echo ""
echo "📁 Generated files:"
echo "  • Screenshots: demo/screenshots/"
echo "  • HTML Report: demo/demo-report.html"
echo "  • Playwright Report: demo/reports/"
echo ""
echo "🌐 To view the HTML report:"
echo "  open demo/demo-report.html"
echo ""
echo "📊 To view Playwright report:"
echo "  npx playwright show-report demo/reports/"
echo ""

# Optional: Open the report
if command -v open > /dev/null; then
    print_status "Opening HTML report..."
    open demo/demo-report.html
elif command -v xdg-open > /dev/null; then
    print_status "Opening HTML report..."
    xdg-open demo/demo-report.html
fi

print_success "Demo runner completed! 🚀"
