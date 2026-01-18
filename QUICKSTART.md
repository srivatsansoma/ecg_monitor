# Quick Start Guide

Get the Hospital Patient Monitoring Simulator running in 5 minutes!

## Prerequisites

- **Node.js 18+** and npm
- **Chrome, Edge, or Opera** browser (Web Serial API support required)
- **Arduino Mega + ESP32** (optional, for hardware testing)

## Installation

### Option 1: Automated Setup (Recommended)

```bash
./setup-and-run.sh
```

This script will:
1. Install all dependencies
2. Start the development server
3. Open the app in your browser at http://localhost:3000

### Option 2: Manual Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## First Run - Testing Without Hardware

You can test the complete UI and functionality without any Arduino hardware connected:

### Step 1: Access the Application
- Open Chrome or Edge browser
- Navigate to http://localhost:3000
- You should see the main dashboard

### Step 2: Simulate Serial Port Connection
Since Web Serial API requires user interaction, you can:
1. Click "Add Port" in Serial Port Configuration
2. A browser dialog will appear (requires actual hardware or virtual serial port)
3. For testing UI only, you can skip this and explore other features

### Step 3: Explore the Interface
- **Configuration Panels**: Located on the left side
  - Serial Port Configuration
  - Arduino Configuration
  - Cloud Endpoint Configuration

- **Vitals Panel**: Located on the right side
  - Configure patient vital signs
  - Set min/max ranges
  - Adjust transmission frequency

- **Pathway Status**: Top section shows full communication chain status

- **Transmission Panel**: Bottom section for start/stop control and logs

### Step 4: Configure Cloud Endpoint (Works Without Hardware)
1. Select a cloud provider (AWS IoT, Azure IoT, Google Cloud IoT, or Custom)
2. Enter any valid HTTPS URL for testing:
   ```
   https://httpbin.org/post
   ```
3. Click "Test Connection"
4. Status should turn green (simulated test)

### Step 5: Configure Vitals
1. In the Vitals Configuration panel, you'll see all available metrics:
   - Temperature, Heart Rate, Blood Pressure, SpO2, etc.
2. Click the settings icon on any vital to expand configuration
3. Adjust min/max values and frequency as needed
4. Enable/disable vitals with checkboxes

## Testing With Hardware

### Step 1: Flash Arduino & ESP32
Follow instructions in `arduino-examples/README.md`:
1. Flash `patient_monitor_receiver.ino` to Arduino Mega
2. Flash `esp32_cloud_forwarder.ino` to ESP32
3. Wire them together as per documentation

### Step 2: Connect Arduino to Computer
1. Connect Arduino Mega via USB
2. Ensure drivers are installed (CH340/FTDI if needed)
3. Verify device appears in system (check Device Manager on Windows)

### Step 3: Configure Serial Port
1. In the web app, click "Add Port"
2. Browser will show available serial ports
3. Select your Arduino device
4. Click "Connect" or "Test Port"
5. Status indicator should turn green

### Step 4: Deploy Bootstrap Code
1. Once serial port is connected, go to Arduino Configuration panel
2. Click "Deploy Bootstrap Code"
3. Wait for deployment (Arduino LED will blink)
4. Health checks will start automatically (every 500ms)
5. Status should turn green

### Step 5: Configure Cloud Endpoint
1. Select your cloud provider
2. Enter your actual cloud endpoint URL
3. Click "Test Connection"
4. If successful, status turns green

### Step 6: Start Data Transmission
1. Verify all three status indicators are green:
   - ✅ Serial Port
   - ✅ Arduino
   - ✅ Cloud
2. Review vitals configuration
3. Click "Start" in Transmission Panel
4. Watch the console logs for transmitted data
5. Packet counter will increment with each transmission

### Step 7: Real-Time Adjustments
While transmission is running:
1. Click settings icon on any vital
2. Expand the configuration
3. Enter a value in "Current Value (Runtime Override)"
4. The next transmitted packet will use your value
5. Clear the field to return to automatic generation

## Common Use Cases

### Scenario 1: Testing UI/UX Only
- No hardware needed
- Explore all panels and configurations
- Test cloud endpoint with httpbin.org
- See how vitals configuration works

### Scenario 2: Testing Serial Communication
- Requires Arduino Mega
- Test port selection and connection
- Verify bootstrap deployment
- Check health monitoring

### Scenario 3: End-to-End Testing
- Requires Arduino Mega + ESP32 + WiFi
- Test full data pipeline
- Monitor each hop with status indicators
- Verify cloud data reception

### Scenario 4: Simulate Patient Scenarios
- Configure vitals for specific conditions:
  - **Fever**: Temperature 38-40°C
  - **Tachycardia**: Heart Rate 120-150 bpm
  - **Hypoxia**: SpO2 85-92%
  - **Hypertension**: Systolic BP 160-180 mmHg
- Start transmission
- Override values in real-time to simulate events
- Monitor how data flows through the system

## Features to Try

### 1. Multiple Vitals Configuration
- Enable 10+ different vital signs
- Each with independent frequency
- Configure realistic ranges for adults/children

### 2. Variable Transmission Rates
- Adjust global transmission frequency
- Test high-frequency (10 Hz) vs low-frequency (0.1 Hz)
- Observe packet rate in console

### 3. Real-Time Overrides
- Start transmission with automatic values
- Override specific vitals during transmission
- Simulate sudden patient condition changes

### 4. Connection Monitoring
- Disconnect USB cable during transmission
- Observe automatic error detection
- Reconnect and resume

### 5. Cloud Provider Testing
- Test different endpoint URLs
- Switch between AWS IoT, Azure IoT, Google Cloud IoT
- Verify JSON payload format in logs

## Keyboard Shortcuts

Currently none, but you can:
- Use Tab to navigate between fields
- Enter to submit in text inputs
- Space to toggle checkboxes

## Troubleshooting

### Port Not Showing Up
**Problem**: "Add Port" clicked, but no devices shown

**Solutions**:
- Ensure Arduino is connected via USB
- Check USB cable (some are charge-only)
- Install CH340 or FTDI drivers
- Try a different USB port
- Restart browser and try again

### Web Serial API Not Supported
**Problem**: Error message about API not supported

**Solutions**:
- Use Chrome 89+, Edge 89+, or Opera 76+
- Firefox and Safari don't support Web Serial API
- Ensure you're on HTTPS or localhost
- Update browser to latest version

### Connection Test Fails
**Problem**: Port test shows red status

**Solutions**:
- Check if port is used by another application (Arduino IDE Serial Monitor, PuTTY, etc.)
- Verify correct baud rate (115200)
- Try disconnecting and reconnecting Arduino
- Restart the web application

### Bootstrap Deployment Fails
**Problem**: Arduino status stays yellow/red

**Solutions**:
- Ensure Arduino sketch is flashed correctly
- Check Serial Monitor on Arduino IDE for errors
- Verify baud rate matches (115200)
- Try re-flashing Arduino with example code

### No Data Transmission
**Problem**: Click "Start" but no logs appear

**Solutions**:
- Verify all three status indicators are green
- Enable at least one vital sign
- Check browser console for JavaScript errors
- Ensure transmission frequency is > 0

### ESP32 Not Sending to Cloud
**Problem**: Data reaches Arduino but not cloud

**Solutions**:
- Check ESP32 WiFi connection (LED indicator)
- Verify cloud endpoint URL is correct
- Test endpoint with curl/Postman first
- Check ESP32 Serial Monitor for error messages
- Ensure API keys/credentials are correct

## Next Steps

After getting started:

1. **Read Full Documentation**: See README.md for complete feature list
2. **Hardware Setup**: Check arduino-examples/README.md for wiring guide
3. **Cloud Integration**: Set up real AWS IoT/Azure IoT endpoints
4. **Customize Vitals**: Add new vital signs to suit your needs
5. **Deploy**: Build production version with `npm run build`

## Support

- **GitHub Issues**: Report bugs or request features
- **Documentation**: See README.md and arduino-examples/README.md
- **Browser Console**: Check for JavaScript errors (F12 → Console tab)
- **Serial Monitor**: Check Arduino/ESP32 output for hardware issues

## Pro Tips

💡 **Use httpbin.org for testing**: `https://httpbin.org/post` - great for testing without real cloud setup

💡 **Virtual Serial Ports**: Use com0com (Windows) or socat (Linux) for testing without hardware

💡 **Development**: Keep browser DevTools open (F12) to see network requests and logs

💡 **Multiple Browsers**: Open in multiple browser windows to test simultaneously

💡 **Save Configurations**: Use browser's Local Storage to save your settings (feature can be added)

---

**Ready to start? Run `./setup-and-run.sh` and begin monitoring! 🏥💓**

