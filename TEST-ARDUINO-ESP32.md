# Test Arduino → ESP32 Communication

## Quick Test Steps:

### 1. **Reflash the ESP32** with the updated code
   - Upload `arduino-examples/esp32_cloud_forwarder.ino`
   - The new code has better debugging

### 2. **Check if transmission is running in the Web UI:**
   - Look at the "Vitals Transmission" panel
   - Click "Start Transmission" if not running
   
### 3. **What to look for in ESP32 logs:**

**If Arduino is sending data, you'll see:**
```json
{"arduino_data_stats":{"received":11,"last_ms_ago":0}}
{"json_received":{"seq":1,"len":250}}
{"send_cloud":{"protocol":"mqtt","seq":1,"payload_len":250}}
{"cloud_sent":{"protocol":"mqtt","seq":1}}
```

**If NO data is coming from Arduino, you'll ONLY see:**
```json
{"status_report":{"wifi":true,"mqtt":true,"packets_sent":0,...}}
```

### 4. **Manual Test - Send test data from Web UI:**

In the browser console, run:
```javascript
// Send a test JSON packet
const testData = JSON.stringify({
  test: true,
  temperature: 37.0,
  timestamp: new Date().toISOString()
});
console.log('Sending test:', testData);
```

Then click "Start Transmission" button in the UI.

### 5. **Check Arduino Serial Output:**

The Arduino should show:
```json
{"status":"forwarded","seq":1,"timestamp":...}
```

If you DON'T see this, the Arduino isn't receiving data from the Web UI.

### 6. **Verify Physical Connections:**
- Arduino TX1 (Pin 18) → ESP32 RX (GPIO 16)
- Arduino RX1 (Pin 19) → ESP32 TX (GPIO 17)  
- Common GND

### 7. **Common Issues:**

❌ **If packets_sent stays 0:**
- Data isn't reaching ESP32
- Check physical wiring
- Verify Arduino is forwarding (check Arduino serial output)

❌ **If you see "unknown_cmd":**
- Data format is wrong
- Arduino might be sending non-JSON data

✅ **If you see "json_received" and "cloud_sent":**
- Everything is working!
- Check AWS IoT Console to see the data

