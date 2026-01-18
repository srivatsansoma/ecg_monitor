#!/bin/bash

# Verification Script for Hospital Patient Monitoring Simulator

echo "================================================"
echo "Hospital Patient Monitoring Simulator"
echo "Setup Verification"
echo "================================================"
echo ""

ERRORS=0
WARNINGS=0

# Function to print success
success() {
    echo "✅ $1"
}

# Function to print error
error() {
    echo "❌ $1"
    ((ERRORS++))
}

# Function to print warning
warning() {
    echo "⚠️  $1"
    ((WARNINGS++))
}

# Check Node.js
echo "Checking Prerequisites..."
echo ""

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    success "Node.js installed: $NODE_VERSION"
else
    error "Node.js is not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    success "npm installed: $NPM_VERSION"
else
    error "npm is not installed"
fi

echo ""
echo "Checking Project Files..."
echo ""

# Check essential files
FILES=(
    "package.json"
    "vite.config.ts"
    "tsconfig.json"
    "tailwind.config.js"
    "index.html"
    "src/App.tsx"
    "src/main.tsx"
    "src/index.css"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        success "Found: $file"
    else
        error "Missing: $file"
    fi
done

echo ""
echo "Checking Components..."
echo ""

COMPONENTS=(
    "src/components/SerialPortPanel.tsx"
    "src/components/ArduinoPanel.tsx"
    "src/components/CloudEndpointPanel.tsx"
    "src/components/PathwayStatus.tsx"
    "src/components/VitalsConfigPanel.tsx"
    "src/components/TransmissionPanel.tsx"
    "src/components/StatusIndicator.tsx"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        success "Found: $(basename $component)"
    else
        error "Missing: $component"
    fi
done

echo ""
echo "Checking Services..."
echo ""

SERVICES=(
    "src/services/serialService.ts"
    "src/services/vitalsGenerator.ts"
    "src/services/cloudService.ts"
)

for service in "${SERVICES[@]}"; do
    if [ -f "$service" ]; then
        success "Found: $(basename $service)"
    else
        error "Missing: $service"
    fi
done

echo ""
echo "Checking Arduino Examples..."
echo ""

ARDUINO=(
    "arduino-examples/patient_monitor_receiver.ino"
    "arduino-examples/esp32_cloud_forwarder.ino"
    "arduino-examples/README.md"
)

for arduino in "${ARDUINO[@]}"; do
    if [ -f "$arduino" ]; then
        success "Found: $(basename $arduino)"
    else
        warning "Missing: $arduino (optional for testing)"
    fi
done

echo ""
echo "Checking Documentation..."
echo ""

DOCS=(
    "README.md"
    "QUICKSTART.md"
    "PROJECT_SUMMARY.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        success "Found: $doc"
    else
        warning "Missing: $doc"
    fi
done

echo ""
echo "Checking node_modules..."
echo ""

if [ -d "node_modules" ]; then
    success "Dependencies installed (node_modules exists)"
else
    warning "Dependencies not installed yet (run: npm install)"
fi

echo ""
echo "================================================"
echo "Verification Summary"
echo "================================================"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ All essential checks passed!"
    echo ""
    
    if [ $WARNINGS -gt 0 ]; then
        echo "⚠️  $WARNINGS warning(s) found (non-critical)"
        echo ""
    fi
    
    if [ ! -d "node_modules" ]; then
        echo "📋 Next Steps:"
        echo "   1. Run: npm install"
        echo "   2. Run: npm run dev"
        echo "   3. Open: http://localhost:3000"
    else
        echo "🚀 You're ready to go!"
        echo ""
        echo "To start the application:"
        echo "   npm run dev"
        echo ""
        echo "Or use the automated script:"
        echo "   ./setup-and-run.sh"
    fi
else
    echo "❌ $ERRORS error(s) found"
    
    if [ $WARNINGS -gt 0 ]; then
        echo "⚠️  $WARNINGS warning(s) found"
    fi
    
    echo ""
    echo "Please fix the errors above before proceeding."
fi

echo ""
echo "================================================"

