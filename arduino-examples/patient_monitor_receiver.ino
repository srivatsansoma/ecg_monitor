/*
 * Hospital Patient Monitoring Simulator - Arduino Mega Receiver
 * 
 * This Arduino sketch receives patient vital data from the web simulator
 * via serial port and forwards it to ESP32 for cloud transmission.
 * 
 * Hardware Requirements:
 * - Arduino Mega 2560
 * - ESP32 module
 * - USB cable for serial communication
 * 
 * Connections:
 * - Arduino RX1 (Pin 19) -> ESP32 TX
 * - Arduino TX1 (Pin 18) -> ESP32 RX
 * - Common GND between Arduino and ESP32
 * 
 * Serial Communication:
 * - USB Serial (Serial): 115200 baud - Communication with Web App
 * - Hardware Serial1: 115200 baud - Communication with ESP32
 */

#define LED_PIN 13
#define BAUD_RATE 115200
#define ESP32_SERIAL Serial1

// Buffer for incoming data
String inputBuffer = "";
unsigned long forwardedCount = 0;

// Status tracking
unsigned long lastPingTime = 0;
unsigned long lastDataTime = 0;
const unsigned long TIMEOUT_MS = 5000;
bool isReady = false;

void setup() {
  // Initialize USB Serial for communication with Web App
  Serial.begin(BAUD_RATE);
  
  // Initialize Serial1 for communication with ESP32
  ESP32_SERIAL.begin(BAUD_RATE);
  
  // Initialize LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Wait for serial ports to initialize
  delay(1000);
  
  // Send ready signal
  Serial.println("{\"status\":\"ready\",\"device\":\"Arduino Mega\"}");
  isReady = true;
  
  // Blink LED to indicate ready
  blinkLED(3);
}

void loop() {
  // Check for incoming data from Web App
  while (Serial.available()) {
    char inChar = (char)Serial.read();

    if (inChar == '\n') {
      if (inputBuffer.length() > 0) {
        processCommand(inputBuffer);
        inputBuffer = "";
      }
    } else {
      inputBuffer += inChar;
    }
  }
  
  // Check for data from ESP32
  if (ESP32_SERIAL.available()) {
    String esp32Response = ESP32_SERIAL.readStringUntil('\n');
    Serial.print("ESP32_LOG ");
    Serial.println(esp32Response);
  }
  
  // Blink LED periodically to show activity
  if (millis() - lastDataTime > 1000) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
  }
}

void processCommand(String data) {
  data.trim();
  lastDataTime = millis();
  
  // Handle different commands
  if (data == "TEST") {
    handleTest();
  }
  else if (data == "PING") {
    handlePing();
  }
  else if (data == "BOOTSTRAP") {
    handleBootstrap();
  }
  else if (data.startsWith("WIFI_CONFIG ")) {
    handleWifiConfig(data);
  }
  else if (data.startsWith("AWS_CONFIG ")) {
    handleAwsConfig(data);
  }
  else if (data.startsWith("{")) {
    // JSON data - forward to ESP32
    handleVitalsData(data);
  }
  else {
    Serial.print("{\"status\":\"unknown_command\",\"data\":\"");
    Serial.print(data);
    Serial.println("\"}");
  }
}

void handleTest() {
  Serial.println("{\"status\":\"test_ok\",\"timestamp\":" + String(millis()) + "}");
  blinkLED(1);
}

void handlePing() {
  lastPingTime = millis();
  Serial.println("{\"status\":\"pong\",\"ready\":true,\"timestamp\":" + String(millis()) + "}");
}

void handleBootstrap() {
  Serial.println("{\"status\":\"bootstrapping\"}");
  delay(500);
  
  // Initialize ESP32 communication
  ESP32_SERIAL.println("INIT");
  delay(500);
  
  isReady = true;
  Serial.println("{\"status\":\"bootstrap_complete\",\"ready\":true}");
  blinkLED(5);
}

void handleWifiConfig(String data) {
  // Forward WiFi config to ESP32
  ESP32_SERIAL.println(data);
  Serial.println("{\"status\":\"wifi_config_forwarded\"}");
  blinkLED(2);
}

void handleAwsConfig(String data) {
  ESP32_SERIAL.println(data);
  Serial.println("{\"status\":\"aws_config_forwarded\"}");
  blinkLED(2);
}

void handleVitalsData(String jsonData) {
  // Forward vitals data to ESP32
  ESP32_SERIAL.println(jsonData);
  forwardedCount++;
  
  // Send acknowledgment back to Web App
  Serial.print("{\"status\":\"forwarded\",\"seq\":");
  Serial.print(forwardedCount);
  Serial.print(",\"timestamp\":");
  Serial.print(millis());
  Serial.println("}");
  
  // Blink LED to show data transmission
  digitalWrite(LED_PIN, HIGH);
  delay(50);
  digitalWrite(LED_PIN, LOW);
}

void blinkLED(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}

