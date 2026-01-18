# Arduino & ESP32 Example Code

This folder contains example Arduino sketches for the Hospital Patient Monitoring Simulator hardware components.

## Files

### 1. `patient_monitor_receiver.ino`
Arduino Mega sketch that:
- Receives patient vitals data from the web simulator via USB serial
- Responds to health check pings
- Forwards data to ESP32 via Hardware Serial
- Provides visual feedback with LED indicators

### 2. `esp32_cloud_forwarder.ino`
ESP32 sketch that:
- Receives data from Arduino Mega via serial
- Connects to WiFi network
- Forwards vitals data to cloud IoT platforms via HTTP/HTTPS
- Handles connection failures gracefully

## Hardware Setup

### Components Required
1. **Arduino Mega 2560**
2. **ESP32 Development Board** (DevKitC or similar)
3. **USB Cable** (Type A to Type B for Arduino)
4. **Jumper Wires** (Male-to-Male)
5. **Breadboard** (optional, for prototyping)

### Wiring Connections

```
Arduino Mega          ESP32
----------------------------------------
TX1 (Pin 18)    ->    RX (GPIO 16)
RX1 (Pin 19)    ->    TX (GPIO 17)
GND             ->    GND
```

### Power
- Arduino Mega: Powered via USB from computer
- ESP32: Can be powered via USB or from Arduino's 5V/3.3V pin

## Software Setup

### Arduino IDE Setup

1. **Install Arduino IDE**
   - Download from: https://www.arduino.cc/en/software
   - Version 2.0+ recommended

2. **Install Board Support**
   
   For Arduino Mega:
   - Usually pre-installed
   - Board: "Arduino Mega or Mega 2560"
   - Processor: "ATmega2560 (Mega 2560)"
   
   For ESP32:
   - Open Arduino IDE
   - Go to File → Preferences
   - Add to "Additional Boards Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to Tools → Board → Boards Manager
   - Search for "esp32" and install "ESP32 by Espressif Systems"

3. **Install Required Libraries**
   
   For ESP32 sketch only:
   - Go to Sketch → Include Library → Manage Libraries
   - Install "ArduinoJson" by Benoit Blanchon (version 6.x)
   - Install "PubSubClient" by Nick O'Leary

### Flashing Instructions

#### Arduino Mega

1. Open `patient_monitor_receiver.ino` in Arduino IDE
2. Select board: Tools → Board → Arduino AVR Boards → Arduino Mega or Mega 2560
3. Select processor: Tools → Processor → ATmega2560 (Mega 2560)
4. Select port: Tools → Port → (Select your Arduino's COM port)
5. Click Upload button or press Ctrl+U
6. Wait for "Done uploading" message

#### ESP32

1. Open `esp32_cloud_forwarder.ino` in Arduino IDE
2. **Important**: Update WiFi credentials:
   ```cpp
   const char* WIFI_SSID = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   ```
3. Update cloud endpoint (if using real cloud):
   ```cpp
   const char* CLOUD_ENDPOINT = "https://your-endpoint.amazonaws.com/prod/data";
   const char* API_KEY = "YOUR_API_KEY";
   ```
4. Select board: Tools → Board → ESP32 Arduino → ESP32 Dev Module
5. Select port: Tools → Port → (Select your ESP32's COM port)
6. Click Upload button or press Ctrl+U
7. Wait for "Done uploading" message

## Configuration

### Baud Rate
Both sketches use **115200 baud** by default. If you need to change it:
- Update `#define BAUD_RATE` in both sketches
- Keep both Arduino and ESP32 at the same baud rate

### WiFi Credentials from the Web UI
You can now provide WiFi credentials directly from the simulator UI:
- Open the **Arduino Configuration** panel
- Enter **WiFi SSID** and **WiFi Password**
- Click **Send WiFi Config to ESP32**

The Web App sends a `WIFI_CONFIG {\"ssid\":\"...\",\"password\":\"...\"}` command to Arduino,
which forwards it to ESP32. ESP32 applies the credentials and attempts to reconnect.

### AWS IoT Config from the Web UI
When AWS IoT is selected, you can send AWS IoT Core settings from the simulator UI:
- AWS IoT Endpoint, Client ID, Topic
- Root CA, Device Certificate, Private Key

The Web App sends `AWS_CONFIG { ... }` to Arduino, which forwards it to ESP32.

### LED Indicators

**Arduino Mega (Pin 13):**
- Slow blink: Idle, waiting for data
- Quick blink: Data received and forwarded
- Multiple blinks on startup: Ready signal

**ESP32 (Pin 2 - built-in LED):**
- Blinking during WiFi connection
- Solid on: WiFi connected
- Quick blink: Data sent to cloud successfully

## Testing

### 1. Test Arduino Mega Alone

1. Flash the Arduino sketch
2. Open Serial Monitor (Tools → Serial Monitor)
3. Set baud rate to 115200
4. Type `TEST` and press Enter
5. You should see: `{"status":"test_ok","timestamp":...}`

### 2. Test PING Command

1. In Serial Monitor, type `PING` and press Enter
2. You should see: `{"status":"pong","ready":true,...}`

### 3. Test Bootstrap

1. Type `BOOTSTRAP` and press Enter
2. Arduino will initialize ESP32 communication
3. You should see: `{"status":"bootstrap_complete","ready":true}`

### 4. Test Data Forwarding

1. Send a JSON payload:
   ```json
   {"temperature":37.5,"heartRate":72,"timestamp":"2024-01-01T00:00:00Z"}
   ```
2. Arduino should respond with: `{"status":"forwarded",...}`

### 5. Test Full System

1. Connect both Arduino and ESP32 as per wiring diagram
2. Flash both devices
3. Open Serial Monitor on Arduino's port
4. Send test data and verify ESP32 receives it
5. Check ESP32 Serial Monitor for cloud transmission status

## Troubleshooting

### Arduino Not Detected
- Check USB cable (some cables are charge-only)
- Install CH340 or FTDI drivers if needed
- Try a different USB port
- Check Device Manager (Windows) or `ls /dev/tty*` (Linux/Mac)

### ESP32 Not Detected
- Install CP210x or CH340 drivers
- Hold BOOT button while uploading
- Try lower upload speed: Tools → Upload Speed → 115200

### No Communication Between Devices
- Verify wiring connections
- Check common ground connection
- Confirm both use same baud rate (115200)
- Use logic level converter if needed (ESP32 is 3.3V, Arduino is 5V)

### WiFi Connection Failed
- Double-check SSID and password
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)

## AWS IoT Core (MQTT/TLS) Setup

AWS IoT Core uses **MQTT over TLS** with X.509 certificates (not HTTP). The ESP32 sketch
supports AWS IoT Core when `USE_AWS_IOT = true`.

### Steps
1. Create an **IoT Thing** in AWS IoT Core
2. Create **Device Certificate + Private Key**
3. Attach an **IoT Policy** that allows:
   - `iot:Connect`
   - `iot:Publish`
   - `iot:Subscribe`
   - `iot:Receive`
4. Note your **AWS IoT Endpoint** (looks like `xxxxxxxx-ats.iot.<region>.amazonaws.com`)
5. Update these fields in `esp32_cloud_forwarder.ino`:
   - `AWS_IOT_ENDPOINT`
   - `AWS_IOT_CLIENT_ID`
   - `AWS_IOT_TOPIC`
6. Paste certs into the PEM blocks:
   - `AWS_ROOT_CA` (Amazon Root CA 1)
   - `DEVICE_CERT`
   - `PRIVATE_KEY`
7. Flash the ESP32

### Topic
Default topic: `hospital/vitals`

You can view messages in AWS IoT Core → MQTT test client.
- Check WiFi signal strength
- Disable MAC filtering on router temporarily

### Cloud Upload Failed
- Verify endpoint URL is correct
- Check API key/credentials
- Ensure HTTPS certificate is valid
- Test endpoint with curl/Postman first

## Web Simulator Integration

Once hardware is ready:

1. Connect Arduino Mega via USB to computer
2. Open the web simulator in Chrome/Edge
3. Click "Add Port" and select Arduino's port
4. Click "Test Port" or "Connect"
5. Deploy bootstrap code using simulator UI
6. Configure cloud endpoint
7. Start vitals transmission

The simulator will:
- Send JSON vitals data to Arduino via serial
- Arduino forwards to ESP32
- ESP32 uploads to cloud
- Status indicators show each hop's health

## Notes

- The ESP32 code uses HTTP POST by default
- For production, implement proper MQTT or cloud SDK
- Add authentication and encryption for real deployments
- Monitor memory usage for long-running operations
- Consider adding error recovery and retry logic

## Support

For issues with:
- Arduino/ESP32 code: Check Serial Monitor output
- Wiring: Use multimeter to verify connections
- Web Serial API: Ensure browser supports it (Chrome/Edge)

## License

MIT License - Free to use and modify

