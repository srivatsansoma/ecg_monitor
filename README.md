# Hospital Patient Monitoring Simulator

A comprehensive web-based IoT simulator for hospital patient monitoring systems. This application simulates patient vital signs and transmits data through Arduino Mega + ESP32 to cloud IoT platforms.

## Features

### 1. Serial Port Communication
- **Port Selection**: Select from available serial ports via dropdown
- **Port Testing**: Test port availability and responsiveness
- **Status Indicators**: Visual feedback with color-coded status (Green/Red/Yellow/Gray)
- **Web Serial API**: Browser-based serial communication (Chrome/Edge)

### 2. Arduino Integration
- **Bootstrap Deployment**: Deploy initialization code to Arduino Mega
- **Health Monitoring**: Continuous health checks every 500ms
- **Real-time Status**: Live connection status with visual indicators
- **ESP32 Communication**: Simulates Arduino-ESP32 data forwarding

### 3. Cloud IoT Platform Support
- **Multiple Providers**: AWS IoT, Azure IoT Hub, Google Cloud IoT Core, Custom endpoints
- **Connection Testing**: Verify cloud endpoint reachability
- **Data Transmission**: Simulated cloud data upload via ESP32

### 4. Comprehensive Pathway Monitoring
- **Visual Dashboard**: Real-time status of entire communication chain
- **End-to-End Visibility**: Web App → Arduino → Cloud
- **Error Detection**: Instant identification of connection failures

### 5. Patient Vitals Simulation
- **Multiple Metrics**:
  - Temperature (°C)
  - Body Heat (°C)
  - Heart Rate (bpm)
  - ECG (mV)
  - Blood Pressure - Systolic/Diastolic (mmHg)
  - Respiratory Rate (breaths/min)
  - Oxygen Saturation - SpO2 (%)
  - End-Tidal CO2 - EtCO2 (mmHg)
  - Cardiac Output (L/min)
  
- **Configurable Parameters**:
  - Minimum and maximum values for each vital
  - Transmission frequency (Hz)
  - Enable/disable individual vitals
  
- **Runtime Control**:
  - Real-time value override during transmission
  - Start/Stop data streaming
  - Adjustable transmission intervals

### 6. Transmission Control & Logging
- **Start/Stop Control**: Easy transmission management
- **Packet Counter**: Track number of packets sent
- **Console Logs**: Detailed transmission logs with timestamps
- **Error Tracking**: Real-time error detection and reporting

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Browser API**: Web Serial API
- **Communication**: Serial Port (USB), Simulated Cloud APIs

## Prerequisites

- **Browser**: Chrome 89+, Edge 89+, or Opera 76+ (Web Serial API support)
- **Connection**: HTTPS or localhost (required for Web Serial API)
- **Hardware** (optional for real testing): Arduino Mega, ESP32 module

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hospital-patient-monitoring-simulator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage Guide

### Step 1: Configure Serial Port
1. Click "Add Port" to request access to a serial port
2. Select your Arduino device from the dropdown
3. Click "Test Port" or "Connect" to establish connection
4. Wait for green status indicator

### Step 2: Deploy Arduino Bootstrap
1. Once serial port is connected, navigate to Arduino Configuration
2. Click "Deploy Bootstrap Code"
3. Wait for Arduino to become ready (green status)
4. Health checks will start automatically every 500ms

### Step 3: Configure Cloud Endpoint
1. Select your cloud provider (AWS IoT, Azure IoT, Google Cloud IoT, or Custom)
2. Enter the endpoint URL
3. Click "Test Connection"
4. Wait for green status indicator

### Step 4: Configure Vitals
1. Enable/disable desired vitals using checkboxes
2. Click settings icon to expand configuration
3. Adjust min/max values for realistic ranges
4. Set transmission frequency for each vital

### Step 5: Start Transmission
1. Verify all three components show green status (Serial, Arduino, Cloud)
2. Adjust global transmission frequency if needed
3. Click "Start" button
4. Monitor transmission logs and packet count
5. Update vital values in real-time if needed
6. Click "Stop" to end transmission

## Architecture

```
┌─────────────┐     USB/Serial     ┌──────────────┐     WiFi/LoRa     ┌───────────┐
│  Web App    │ ─────────────────> │ Arduino Mega │ ───────────────> │   Cloud   │
│  (Browser)  │                    │   + ESP32    │                  │  IoT Hub  │
└─────────────┘                    └──────────────┘                  └───────────┘
```

### Data Flow
1. Web app generates patient vital signs
2. Data serialized to JSON format
3. Transmitted via USB/Serial to Arduino Mega
4. Arduino forwards to ESP32 module
5. ESP32 transmits to cloud IoT platform
6. Each hop monitored with status indicators

## Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

## Browser Compatibility

| Browser | Version | Web Serial API | Status |
|---------|---------|----------------|--------|
| Chrome  | 89+     | ✅ Supported   | ✅ Recommended |
| Edge    | 89+     | ✅ Supported   | ✅ Recommended |
| Opera   | 76+     | ✅ Supported   | ✅ Supported |
| Firefox | Any     | ❌ Not Supported | ❌ Not Compatible |
| Safari  | Any     | ❌ Not Supported | ❌ Not Compatible |

## Security Considerations

- Web Serial API requires user permission for each port access
- HTTPS required for production deployment
- Localhost exempt from HTTPS requirement
- Cloud credentials should be properly secured (not implemented in simulator)

## Troubleshooting

### Serial Port Not Showing
- Ensure Arduino is connected via USB
- Check driver installation (CH340/FTDI drivers)
- Try clicking "Add Port" again to trigger browser permission

### Connection Failed
- Verify correct baud rate (default: 115200)
- Check if port is already in use by another application
- Try disconnecting and reconnecting the device

### Cloud Endpoint Test Fails
- Verify URL format (must be valid URL)
- Check network connectivity
- Ensure endpoint is accessible from your network

### Data Not Transmitting
- Verify all three status indicators are green
- Check browser console for errors
- Ensure vitals are enabled in configuration

## Future Enhancements

- Real cloud SDK integration (AWS IoT, Azure IoT Hub)
- WebSocket support for real-time monitoring
- Data visualization and charts
- Historical data storage and playback
- Multi-patient simulation
- Advanced vital sign patterns (arrhythmias, etc.)
- Export/Import configuration profiles
- Mobile-responsive design improvements

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions, please open an issue on the repository.

# ecg_monitor
