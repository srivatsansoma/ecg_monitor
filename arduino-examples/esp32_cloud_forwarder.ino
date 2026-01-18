/*
 * Hospital Patient Monitoring Simulator - ESP32 Cloud Forwarder
 * Version: 2.0 (Enhanced Debugging)
 * 
 * This ESP32 sketch receives patient vital data from Arduino Mega
 * and forwards it to cloud IoT platforms (AWS IoT, Azure IoT, Google Cloud IoT)
 * 
 * Hardware Requirements:
 * - ESP32 Development Board
 * - WiFi connection
 * 
 * Connections:
 * - ESP32 RX (GPIO 16) -> Arduino TX1
 * - ESP32 TX (GPIO 17) -> Arduino RX1
 * - Common GND
 * 
 * Configuration:
 * - Update WiFi credentials below
 * - Update cloud endpoint configuration
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ==================== CONFIGURATION ====================

// WiFi Configuration (default - can be overridden via serial command)
String wifiSsid = "Airtel_Kamakoti";
String wifiPassword = "SriVatsan$1";

// Cloud Endpoint Configuration
// Set to true for AWS IoT Core (MQTT/TLS). Set to false for HTTP endpoint.
const bool USE_AWS_IOT = true;

// AWS IoT Core (MQTT/TLS)
String awsEndpoint = "a2nsjsdnekbek0-ats.iot.us-east-1.amazonaws.com";
const int AWS_IOT_PORT = 8883;
String awsClientId = "ESP32PatientMonitor";
String awsTopic = "sdk/test/js";

// HTTP endpoint (used when USE_AWS_IOT = false)
const char* CLOUD_ENDPOINT = "http://localhost:4000/ingest";
const char* API_KEY = "";

// AWS IoT certificates (PEM format)
// Amazon Root CA 1 (downloaded from https://www.amazontrust.com/repository/AmazonRootCA1.pem)
static const char AWS_ROOT_CA[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----
)EOF";

static const char DEVICE_CERT[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDWTCCAkGgAwIBAgIUVt5NZiyMdJJmvOwCWcU/da6N7AkwDQYJKoZIhvcNAQEL
BQAwTTFLMEkGA1UECwxCQW1hem9uIFdlYiBTZXJ2aWNlcyBPPUFtYXpvbi5jb20g
SW5jLiBMPVNlYXR0bGUgU1Q9V2FzaGluZ3RvbiBDPVVTMB4XDTI2MDExNTExNDQz
NloXDTQ5MTIzMTIzNTk1OVowHjEcMBoGA1UEAwwTQVdTIElvVCBDZXJ0aWZpY2F0
ZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMqkG9N1xxtOSv92lDgH
XZehZ2EpdR/J4OJWLT3iXrwercIFgaLr3hO0QNepNOlZnCxkfMkDvXCR7+dDHbfZ
FV3LcH/FQoSZZb9n0pwyyyhirh3BS8IiQh/mTY8y8k+HDsLWktkC1zKD/ZkNcvSe
bwFGMqabNwD6BZMeH674Atl0WbhA5kqzQXhEcwCmq8xI/kVKevhzcymO3JS8KlKR
voocvTZwxXoOyPWHY+tatMKVhMB0GRV1FLpBN2vFn3Ep0d4Be7WBvsSryrQZNNc9
L3FezM6gi7CiHb9tHQn0sHZASb+JFsNpbAigyyI8x/K/MfDAfeNgdEArhoY/gwJU
mVMCAwEAAaNgMF4wHwYDVR0jBBgwFoAUp8Ou1LRpJbL2p/dD1j166WA3NCAwHQYD
VR0OBBYEFJFkR4cIm8iNpFdS9JmexZyoy4IqMAwGA1UdEwEB/wQCMAAwDgYDVR0P
AQH/BAQDAgeAMA0GCSqGSIb3DQEBCwUAA4IBAQAYKdMMwc/0pJXY5xy25j+ZClCD
LnrU5mXBR1/pPHdCaC7Rv/wZr1T01CyvEFdnpJ5nIi7F/EAiMhAGwIcMzXB9Wcss
vqnDe1a6wYeYniXrNO3LIrk9xj9Qw4GPd1bPstzL1buxzqTbCdtTn4qj6JvWDzJk
0kWZBCAMPtT1zLIKUNjHPpvuNxyou2FL0Cl4Dshk2vh/8+nbLlmeHIFtLa6FdzZp
QswnLr4RiPEwBKmv9jpI6e4Q2CMx2dkUpUf7ewQDz/Zpj1mf0EY+HNQxNz4a/pmW
sH0bovaDG9ZzXCK0GywlR/6vji/MyJjN9ciGPdfw0zSup0EjwreEXJ3WYaaY
-----END CERTIFICATE-----
)EOF";

static const char PRIVATE_KEY[] PROGMEM = R"EOF(
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAyqQb03XHG05K/3aUOAddl6FnYSl1H8ng4lYtPeJevB6twgWB
ouveE7RA16k06VmcLGR8yQO9cJHv50Mdt9kVXctwf8VChJllv2fSnDLLKGKuHcFL
wiJCH+ZNjzLyT4cOwtaS2QLXMoP9mQ1y9J5vAUYypps3APoFkx4frvgC2XRZuEDm
SrNBeERzAKarzEj+RUp6+HNzKY7clLwqUpG+ihy9NnDFeg7I9Ydj61q0wpWEwHQZ
FXUUukE3a8WfcSnR3gF7tYG+xKvKtBk01z0vcV7MzqCLsKIdv20dCfSwdkBJv4kW
w2lsCKDLIjzH8r8x8MB942B0QCuGhj+DAlSZUwIDAQABAoIBAQCv4TRNmyIPbyrl
A9SttKblHrANwt/nkV7g1A88cSfse2wwxHq6H6KG06KcDD7icmZ8mVM9XUOlWuUw
gi5fDcnfuN2R6HJNiJ6pPMGt1OBD0zJwnP7WJsnhyhBzQ7LQl9aWAYs/U5nYPHt1
xhiKfKC4KGd596oL7PW9tR2mzZgbh7eFkJuYTTS7VEnd4vHPfvahyiv/ex/wSn0V
HCKdG5V37ouU7plyeren3hg5C8fMv1blab0fUBFiWKtKFbduUWS34peRGkKEZoK6
bWnEFGzaEYzkofWqNb9yNRoqKCDw8TLAykOgAEKSZlwsACOgSXIo9/xj5IR2hi7J
8EOczVCRAoGBAOkAO1JtFO+B4nbofTBcfUFQnuS4PhZjhckVGi+AxmZvITuEknfV
cJZl5xVZiY11mekA+QjTJmlr1t9gsm73ouZpaca2YRZ0+sPoLPq+UwGLTgI+TmeW
Y5pkV9OxoyWemGXcJ0cqxdSJkZCklcYQakwAhXpOmVduGPvjjO7aUaRdAoGBAN6k
tHIQAMBeDX7A3/QhXanHsC2tfp/4Js9BDTqfZXVOnyO+Z/SLnwZmKMfxtKJeyCjm
UUvJmOqAR/0HpBme7D/VvEfp6/nN34e0ue/eHBqpQJ5lA0WqtJBfH0aqf0WehCqO
SkoJcPL2YftfoeDgDK4xWk3+ZHofB2Ie/3WFUllvAoGAE85sPIZ/SBjPanI66hiC
oUG8MA8lX/vXzI8Zqb4Vn3GE7q1HUh53sqE48oyo77h2e+MUSFbCpiV/n391y48L
bvC5CCZKvID3LB4ZbLsvDSuNVw161r1m/CHZgWpRRwpjRA1h3V/ab0W+dQA4pxyQ
HKPStOHnkRIP16GxQkCWvhUCgYBDJV86SzM+0N63DIo+QVXTH2M1024t5pQly1On
C2143HZIPGNzsCwMrQC9lFrK4VTyaMu51JnmlzuexxApnfFYKyi2c4j0dK9maQ3u
lojZTZQscQB0oVAFfnqbQE5T+8OWZgVnoMNMsxvHyQa0ID4SxtWaUg+ReQwr/ndC
xSuZxwKBgGpFR6ryhkIdU9dwBP4X6sStwZnY+D/zBXn61xUDG5+qqZ99OpgdbUlF
OsEUCdM0oHnMYPV/XpZLI1YjKFmLsJEAlT6xBvBYG1PHSK0erKOIY+HtR2iMkHm+
Vg92WojuoY55942UwvejRZ4CqLtnocDksPGPx73uz7S96a3t514C
-----END RSA PRIVATE KEY-----
)EOF";

// ==================== DEBUG CONFIGURATION ====================

#define BAUD_RATE 115200
#define LED_PIN 2

// Hardware Serial for Arduino communication
#define ARDUINO_SERIAL Serial2
#define ARDUINO_RX 16  // GPIO 16
#define ARDUINO_TX 17  // GPIO 17

const bool DEBUG_VERBOSE = true;
const bool DEBUG_MEMORY = true;
const bool DEBUG_TLS = true;
const bool DEBUG_MQTT = true;

// ==================== STATE VARIABLES ====================

bool wifiConnected = false;
bool mqttConnected = false;
bool certificatesLoaded = false;
unsigned long lastReconnectAttempt = 0;
unsigned long lastStatusReport = 0;
unsigned long lastMqttAttempt = 0;
const unsigned long RECONNECT_INTERVAL = 30000; // 30 seconds
const unsigned long STATUS_REPORT_INTERVAL = 10000; // 10 seconds
const unsigned long MQTT_RETRY_INTERVAL = 5000; // 5 seconds
unsigned long packetSeq = 0;
unsigned long mqttAttempts = 0;
unsigned long mqttSuccesses = 0;
unsigned long mqttFailures = 0;

String inputBuffer = "";
bool dataComplete = false;

WiFiClientSecure secureClient;
PubSubClient mqttClient(secureClient);

String runtimeRootCa;
String runtimeDeviceCert;
String runtimePrivateKey;

// ==================== HELPER FUNCTIONS ====================

void logDebug(const char* tag, const char* message) {
  if (DEBUG_VERBOSE) {
    Serial.print("{\"log\":\"");
    Serial.print(tag);
    Serial.print("\",\"msg\":\"");
    Serial.print(message);
    Serial.print("\",\"ts\":");
    Serial.print(millis());
    Serial.println("}");
  }
}

void logStatus(const char* status, const char* details = "") {
  Serial.print("{\"status\":\"");
  Serial.print(status);
  Serial.print("\"");
  if (strlen(details) > 0) {
    Serial.print(",\"details\":\"");
    Serial.print(details);
    Serial.print("\"");
  }
  Serial.print(",\"ts\":");
  Serial.print(millis());
  Serial.println("}");
}

void logMemory() {
  if (DEBUG_MEMORY) {
    Serial.print("{\"memory\":{\"free\":");
    Serial.print(ESP.getFreeHeap());
    Serial.print(",\"min_free\":");
    Serial.print(ESP.getMinFreeHeap());
    Serial.print(",\"ts\":");
    Serial.print(millis());
    Serial.println("}}");
  }
}

bool validateCertificate(const String& cert, const char* type) {
  if (cert.length() == 0) {
    logDebug("CERT_VALIDATION", (String(type) + " is empty").c_str());
    return false;
  }
  
  bool hasBegin = cert.indexOf("-----BEGIN") >= 0;
  bool hasEnd = cert.indexOf("-----END") >= 0;
  
  if (!hasBegin || !hasEnd) {
    logDebug("CERT_VALIDATION", (String(type) + " missing BEGIN/END markers").c_str());
    return false;
  }
  
  if (DEBUG_TLS) {
    Serial.print("{\"cert_valid\":\"");
    Serial.print(type);
    Serial.print("\",\"len\":");
    Serial.print(cert.length());
    Serial.print(",\"preview\":\"");
    Serial.print(cert.substring(0, 50));
    Serial.println("...\"}");
  }
  
  return true;
}

const char* getMqttStateDesc(int state) {
  switch (state) {
    case -4: return "MQTT_CONNECTION_TIMEOUT";
    case -3: return "MQTT_CONNECTION_LOST";
    case -2: return "MQTT_CONNECT_FAILED";
    case -1: return "MQTT_DISCONNECTED";
    case 0: return "MQTT_CONNECTED";
    case 1: return "MQTT_CONNECT_BAD_PROTOCOL";
    case 2: return "MQTT_CONNECT_BAD_CLIENT_ID";
    case 3: return "MQTT_CONNECT_UNAVAILABLE";
    case 4: return "MQTT_CONNECT_BAD_CREDENTIALS";
    case 5: return "MQTT_CONNECT_UNAUTHORIZED";
    default: return "MQTT_UNKNOWN_STATE";
  }
}

void blinkLED(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
}

// ==================== SETUP ====================

void setup() {
  // Initialize USB Serial for debug output
  Serial.begin(BAUD_RATE);
  delay(1000);
  
  // Initialize Serial2 for Arduino communication
  ARDUINO_SERIAL.begin(BAUD_RATE, SERIAL_8N1, ARDUINO_RX, ARDUINO_TX);
  delay(100);
  
  logStatus("boot", "ESP32 Cloud Forwarder v2.0");
  Serial.print("{\"arduino_serial\":{\"rx\":");
  Serial.print(ARDUINO_RX);
  Serial.print(",\"tx\":");
  Serial.print(ARDUINO_TX);
  Serial.println("}}");
  logMemory();
  
  // Initialize LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Print configuration
  Serial.print("{\"config\":{\"use_aws_iot\":");
  Serial.print(USE_AWS_IOT ? "true" : "false");
  Serial.print(",\"aws_port\":");
  Serial.print(AWS_IOT_PORT);
  Serial.print(",\"debug_verbose\":");
  Serial.print(DEBUG_VERBOSE ? "true" : "false");
  Serial.print(",\"debug_memory\":");
  Serial.print(DEBUG_MEMORY ? "true" : "false");
  Serial.print(",\"debug_tls\":");
  Serial.print(DEBUG_TLS ? "true" : "false");
  Serial.println("}}");
  
  // Connect to WiFi
  connectToWiFi();

  // Initialize AWS IoT
  if (USE_AWS_IOT) {
    logStatus("aws_init_start");
    
    runtimeRootCa = AWS_ROOT_CA;
    runtimeDeviceCert = DEVICE_CERT;
    runtimePrivateKey = PRIVATE_KEY;
    
    bool rootCaValid = validateCertificate(runtimeRootCa, "ROOT_CA");
    bool deviceCertValid = validateCertificate(runtimeDeviceCert, "DEVICE_CERT");
    bool privateKeyValid = validateCertificate(runtimePrivateKey, "PRIVATE_KEY");
    
    certificatesLoaded = rootCaValid && deviceCertValid && privateKeyValid;
    
    if (certificatesLoaded) {
      secureClient.setCACert(runtimeRootCa.c_str());
      secureClient.setCertificate(runtimeDeviceCert.c_str());
      secureClient.setPrivateKey(runtimePrivateKey.c_str());
      mqttClient.setServer(awsEndpoint.c_str(), AWS_IOT_PORT);
      mqttClient.setBufferSize(512);
      
      Serial.print("{\"aws_init\":{\"endpoint\":\"");
      Serial.print(awsEndpoint);
      Serial.print("\",\"port\":");
      Serial.print(AWS_IOT_PORT);
      Serial.print(",\"clientId\":\"");
      Serial.print(awsClientId);
      Serial.print("\",\"topic\":\"");
      Serial.print(awsTopic);
      Serial.print("\",\"rootCaLen\":");
      Serial.print(runtimeRootCa.length());
      Serial.print(",\"deviceCertLen\":");
      Serial.print(runtimeDeviceCert.length());
      Serial.print(",\"privateKeyLen\":");
      Serial.print(runtimePrivateKey.length());
      Serial.println("}}");
      
      logStatus("certificates_loaded");
    } else {
      logStatus("certificates_invalid", "Check PEM format");
    }
  }
  
  logMemory();
  Serial.println("{\"device\":\"ESP32\",\"status\":\"ready\"}");
  
  // Blink LED to indicate ready
  blinkLED(3);
}

// ==================== MAIN LOOP ====================

void loop() {
  unsigned long currentMillis = millis();
  
  // MQTT connection management
  if (USE_AWS_IOT && wifiConnected && certificatesLoaded) {
    mqttConnected = mqttClient.connected();
    
    if (!mqttConnected) {
      // Retry MQTT connection with delay
      if (currentMillis - lastMqttAttempt > MQTT_RETRY_INTERVAL) {
        connectToAwsIot();
        lastMqttAttempt = currentMillis;
      }
    } else {
      mqttClient.loop();
    }
  }

  // WiFi connection management
  if (WiFi.status() != WL_CONNECTED) {
    if (wifiConnected) {
      wifiConnected = false;
      mqttConnected = false;
      digitalWrite(LED_PIN, LOW);
      logStatus("wifi_disconnected");
    }
    
    // Try to reconnect
    if (currentMillis - lastReconnectAttempt > RECONNECT_INTERVAL) {
      connectToWiFi();
      lastReconnectAttempt = currentMillis;
    }
  } else {
    if (!wifiConnected) {
      wifiConnected = true;
      logStatus("wifi_restored");
    }
  }
  
  // Periodic status report
  if (DEBUG_VERBOSE && currentMillis - lastStatusReport > STATUS_REPORT_INTERVAL) {
    Serial.print("{\"status_report\":{\"wifi\":");
    Serial.print(wifiConnected ? "true" : "false");
    Serial.print(",\"mqtt\":");
    Serial.print(mqttConnected ? "true" : "false");
    Serial.print(",\"certs\":");
    Serial.print(certificatesLoaded ? "true" : "false");
    Serial.print(",\"packets_sent\":");
    Serial.print(packetSeq);
    Serial.print(",\"mqtt_attempts\":");
    Serial.print(mqttAttempts);
    Serial.print(",\"mqtt_successes\":");
    Serial.print(mqttSuccesses);
    Serial.print(",\"mqtt_failures\":");
    Serial.print(mqttFailures);
    Serial.print(",\"uptime\":");
    Serial.print(currentMillis / 1000);
    Serial.println("}}");
    
    logMemory();
    lastStatusReport = currentMillis;
  }
  
  // Read data from Arduino via Serial2
  static unsigned long lastDataReceived = 0;
  static unsigned long dataPacketsReceived = 0;
  
  while (ARDUINO_SERIAL.available()) {
    char inChar = (char)ARDUINO_SERIAL.read();
    
    if (inChar == '\n') {
      dataComplete = true;
      dataPacketsReceived++;
      lastDataReceived = millis();
    } else {
      inputBuffer += inChar;
    }
  }
  
  // Process complete data
  if (dataComplete) {
    if (DEBUG_VERBOSE && dataPacketsReceived % 10 == 1) {
      Serial.print("{\"arduino_data_stats\":{\"received\":");
      Serial.print(dataPacketsReceived);
      Serial.print(",\"last_ms_ago\":");
      Serial.print(millis() - lastDataReceived);
      Serial.println("}}");
    }
    
    processData(inputBuffer);
    inputBuffer = "";
    dataComplete = false;
  }
}

// ==================== WIFI FUNCTIONS ====================

void connectToWiFi() {
  Serial.print("{\"wifi_connect\":{\"ssid\":\"");
  Serial.print(wifiSsid);
  Serial.print("\",\"attempt\":\"starting\"");
  Serial.println("}}");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSsid.c_str(), wifiPassword.c_str());
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    attempts++;
    
    if (DEBUG_VERBOSE && attempts % 4 == 0) {
      Serial.print("{\"wifi_status\":\"connecting\",\"attempt\":");
      Serial.print(attempts);
      Serial.print(",\"wl_status\":");
      Serial.print(WiFi.status());
      Serial.println("}");
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    digitalWrite(LED_PIN, HIGH);
    
    Serial.print("{\"wifi_connected\":{\"ip\":\"");
    Serial.print(WiFi.localIP());
    Serial.print("\",\"ssid\":\"");
    Serial.print(wifiSsid);
    Serial.print("\",\"rssi\":");
    Serial.print(WiFi.RSSI());
    Serial.print(",\"mac\":\"");
    Serial.print(WiFi.macAddress());
    Serial.print("\",\"gateway\":\"");
    Serial.print(WiFi.gatewayIP());
    Serial.print("\",\"dns\":\"");
    Serial.print(WiFi.dnsIP());
    Serial.print("\",\"attempts\":");
    Serial.print(attempts);
    Serial.println("}}");
  } else {
    wifiConnected = false;
    Serial.print("{\"wifi_failed\":{\"attempts\":");
    Serial.print(attempts);
    Serial.print(",\"wl_status\":");
    Serial.print(WiFi.status());
    Serial.println("}}");
  }
}

// ==================== DATA PROCESSING ====================

void processData(String data) {
  data.trim();
  
  if (data.length() == 0) {
    return;
  }
  
  if (DEBUG_VERBOSE) {
    Serial.print("{\"recv\":{\"len\":");
    Serial.print(data.length());
    Serial.print(",\"preview\":\"");
    Serial.print(data.substring(0, min(50, (int)data.length())));
    Serial.println("...\"}}");
  }
  
  if (data == "INIT") {
    Serial.print("{\"init_response\":{\"wifi\":");
    Serial.print(wifiConnected ? "true" : "false");
    Serial.print(",\"mqtt\":");
    Serial.print(mqttConnected ? "true" : "false");
    Serial.print(",\"certs\":");
    Serial.print(certificatesLoaded ? "true" : "false");
    Serial.println("}}");
    return;
  }

  if (data.startsWith("WIFI_CONFIG ")) {
    handleWifiConfig(data);
    return;
  }

  if (data.startsWith("AWS_CONFIG ")) {
    handleAwsConfig(data);
    return;
  }
  
  if (data.startsWith("{")) {
    // JSON data - send to cloud
    packetSeq++;
    
    if (DEBUG_VERBOSE) {
      Serial.print("{\"json_received\":{\"seq\":");
      Serial.print(packetSeq);
      Serial.print(",\"len\":");
      Serial.print(data.length());
      Serial.println("}}");
    }
    
    sendToCloud(data, packetSeq);
  } else {
    if (data.length() > 0) {
      Serial.print("{\"unknown_cmd\":{\"data\":\"");
      Serial.print(data.substring(0, min(50, (int)data.length())));
      Serial.println("...\"}}");
    }
  }
}

void handleWifiConfig(String data) {
  logStatus("wifi_config_start");
  
  String jsonPart = data.substring(String("WIFI_CONFIG ").length());

  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, jsonPart);

  if (error) {
    Serial.print("{\"wifi_config_error\":{\"code\":\"");
    Serial.print(error.c_str());
    Serial.print("\",\"json_len\":");
    Serial.print(jsonPart.length());
    Serial.println("}}");
    return;
  }

  if (doc.containsKey("ssid")) {
    wifiSsid = doc["ssid"].as<String>();
    logDebug("WIFI_CONFIG", ("SSID: " + wifiSsid).c_str());
  }
  if (doc.containsKey("password")) {
    wifiPassword = doc["password"].as<String>();
    logDebug("WIFI_CONFIG", "Password updated");
  }

  logStatus("wifi_config_received");
  WiFi.disconnect();
  delay(100);
  connectToWiFi();
}

// ==================== CLOUD COMMUNICATION ====================

void sendToCloud(String jsonData, unsigned long seq) {
  if (!wifiConnected) {
    Serial.print("{\"cloud_error\":{\"reason\":\"wifi_not_connected\",\"seq\":");
    Serial.print(seq);
    Serial.println("}}");
    return;
  }
  
  if (DEBUG_VERBOSE) {
    Serial.print("{\"send_cloud\":{\"protocol\":\"");
    Serial.print(USE_AWS_IOT ? "mqtt" : "http");
    Serial.print("\",\"seq\":");
    Serial.print(seq);
    Serial.print(",\"payload_len\":");
    Serial.print(jsonData.length());
    Serial.println("}}");
  }
  
  if (USE_AWS_IOT) {
    if (!certificatesLoaded) {
      Serial.print("{\"cloud_error\":{\"reason\":\"certificates_not_loaded\",\"seq\":");
      Serial.print(seq);
      Serial.println("}}");
      return;
    }
    
    if (!mqttClient.connected()) {
      Serial.print("{\"cloud_error\":{\"reason\":\"mqtt_not_connected\",\"mqtt_state\":\"");
      Serial.print(getMqttStateDesc(mqttClient.state()));
      Serial.print("\",\"state_code\":");
      Serial.print(mqttClient.state());
      Serial.print(",\"seq\":");
      Serial.print(seq);
      Serial.println("}}");
      return;
    }

    if (DEBUG_MQTT) {
      Serial.print("{\"mqtt_publish\":{\"topic\":\"");
      Serial.print(awsTopic);
      Serial.print("\",\"payload_len\":");
      Serial.print(jsonData.length());
      Serial.print(",\"buffer_size\":");
      Serial.print(mqttClient.getBufferSize());
      Serial.println("}}");
    }

    const bool published = mqttClient.publish(awsTopic.c_str(), jsonData.c_str());
    
    if (published) {
      Serial.print("{\"cloud_sent\":{\"protocol\":\"mqtt\",\"topic\":\"");
      Serial.print(awsTopic);
      Serial.print("\",\"seq\":");
      Serial.print(seq);
      Serial.println("}}");
      blinkLED(1);
    } else {
      Serial.print("{\"cloud_error\":{\"protocol\":\"mqtt\",\"reason\":\"publish_failed\",\"buffer_size\":");
      Serial.print(mqttClient.getBufferSize());
      Serial.print(",\"payload_len\":");
      Serial.print(jsonData.length());
      Serial.print(",\"seq\":");
      Serial.print(seq);
      Serial.println("}}");
    }
    return;
  }

  // HTTP fallback
  HTTPClient http;
  http.setTimeout(10000);
  http.begin(CLOUD_ENDPOINT);
  http.addHeader("Content-Type", "application/json");

  if (strlen(API_KEY) > 0) {
    http.addHeader("X-API-Key", API_KEY);
  }

  if (DEBUG_VERBOSE) {
    Serial.print("{\"http_post\":{\"endpoint\":\"");
    Serial.print(CLOUD_ENDPOINT);
    Serial.print("\",\"payload_len\":");
    Serial.print(jsonData.length());
    Serial.println("}}");
  }

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode > 0) {
    String response = http.getString();
    int responseLen = response.length();
    Serial.print("{\"cloud_sent\":{\"protocol\":\"http\",\"code\":");
    Serial.print(httpResponseCode);
    Serial.print(",\"seq\":");
    Serial.print(seq);
    Serial.print(",\"response_len\":");
    Serial.print(responseLen);
    Serial.println("}}");
    blinkLED(1);
  } else {
    Serial.print("{\"cloud_error\":{\"protocol\":\"http\",\"code\":");
    Serial.print(httpResponseCode);
    Serial.print(",\"seq\":");
    Serial.print(seq);
    Serial.println("}}");
  }

  http.end();
}

// ==================== AWS IoT / MQTT FUNCTIONS ====================

void connectToAwsIot() {
  if (!USE_AWS_IOT) {
    return;
  }

  if (mqttClient.connected()) {
    mqttConnected = true;
    return;
  }

  if (!certificatesLoaded) {
    logStatus("mqtt_skip", "certificates_not_loaded");
    return;
  }

  mqttAttempts++;
  
  Serial.print("{\"mqtt_connecting\":{\"attempt\":");
  Serial.print(mqttAttempts);
  Serial.print(",\"endpoint\":\"");
  Serial.print(awsEndpoint);
  Serial.print("\",\"port\":");
  Serial.print(AWS_IOT_PORT);
  Serial.print(",\"clientId\":\"");
  Serial.print(awsClientId);
  Serial.print("\",\"topic\":\"");
  Serial.print(awsTopic);
  Serial.println("\"}}");

  if (DEBUG_TLS) {
    Serial.print("{\"tls_config\":{\"rootCaLen\":");
    Serial.print(runtimeRootCa.length());
    Serial.print(",\"deviceCertLen\":");
    Serial.print(runtimeDeviceCert.length());
    Serial.print(",\"privateKeyLen\":");
    Serial.print(runtimePrivateKey.length());
    Serial.print(",\"rootCaPreview\":\"");
    Serial.print(runtimeRootCa.substring(0, 50));
    Serial.print("\",\"deviceCertPreview\":\"");
    Serial.print(runtimeDeviceCert.substring(0, 50));
    Serial.println("\"}}");
  }
  
  logMemory();

  // Attempt MQTT connection
  bool connected = mqttClient.connect(awsClientId.c_str());
  
  if (connected) {
    mqttConnected = true;
    mqttSuccesses++;
    
    Serial.print("{\"mqtt_connected\":{\"attempt\":");
    Serial.print(mqttAttempts);
    Serial.print(",\"successes\":");
    Serial.print(mqttSuccesses);
    Serial.print(",\"topic\":\"");
    Serial.print(awsTopic);
    Serial.println("\"}}");
    
    blinkLED(2);
  } else {
    mqttConnected = false;
    mqttFailures++;
    
    int state = mqttClient.state();
    const char* stateDesc = getMqttStateDesc(state);
    
    Serial.print("{\"mqtt_failed\":{\"attempt\":");
    Serial.print(mqttAttempts);
    Serial.print(",\"failures\":");
    Serial.print(mqttFailures);
    Serial.print(",\"state_code\":");
    Serial.print(state);
    Serial.print(",\"state_desc\":\"");
    Serial.print(stateDesc);
    Serial.print("\",\"endpoint\":\"");
    Serial.print(awsEndpoint);
    Serial.print("\",\"port\":");
    Serial.print(AWS_IOT_PORT);
    Serial.print(",\"clientId\":\"");
    Serial.print(awsClientId);
    Serial.println("\"}}");
    
    if (DEBUG_TLS) {
      Serial.println("{\"tls_hint\":\"Check endpoint format, certificates (BEGIN/END markers), cert validity, and AWS IoT policy\"}");
    }
  }
  
  logMemory();
}

void handleAwsConfig(String data) {
  logStatus("aws_config_start");
  logMemory();
  
  String jsonPart = data.substring(String("AWS_CONFIG ").length());
  
  Serial.print("{\"aws_config_raw\":{\"bytes\":");
  Serial.print(jsonPart.length());
  Serial.println("}}");
  
  if (DEBUG_VERBOSE) {
    // Print first 200 chars of payload
    Serial.print("{\"aws_config_preview\":\"");
    Serial.print(jsonPart.substring(0, min(200, (int)jsonPart.length())));
    Serial.println("...\"}");
  }
  
  DynamicJsonDocument doc(16384);
  DeserializationError error = deserializeJson(doc, jsonPart);

  if (error) {
    Serial.print("{\"aws_config_error\":{\"reason\":\"json_parse_failed\",\"code\":\"");
    Serial.print(error.c_str());
    Serial.print("\",\"json_len\":");
    Serial.print(jsonPart.length());
    Serial.println("}}");
    return;
  }

  logStatus("aws_config_parsed");

  // Extract configuration
  if (doc.containsKey("endpoint")) {
    awsEndpoint = doc["endpoint"].as<String>();
    logDebug("AWS_CONFIG", ("Endpoint: " + awsEndpoint).c_str());
  }
  if (doc.containsKey("clientId")) {
    awsClientId = doc["clientId"].as<String>();
    logDebug("AWS_CONFIG", ("ClientId: " + awsClientId).c_str());
  }
  if (doc.containsKey("topic")) {
    awsTopic = doc["topic"].as<String>();
    logDebug("AWS_CONFIG", ("Topic: " + awsTopic).c_str());
  }
  if (doc.containsKey("rootCa")) {
    runtimeRootCa = doc["rootCa"].as<String>();
    logDebug("AWS_CONFIG", "Root CA received");
  }
  if (doc.containsKey("deviceCert")) {
    runtimeDeviceCert = doc["deviceCert"].as<String>();
    logDebug("AWS_CONFIG", "Device Cert received");
  }
  if (doc.containsKey("privateKey")) {
    runtimePrivateKey = doc["privateKey"].as<String>();
    logDebug("AWS_CONFIG", "Private Key received");
  }

  // Validate certificates
  bool rootCaValid = validateCertificate(runtimeRootCa, "ROOT_CA");
  bool deviceCertValid = validateCertificate(runtimeDeviceCert, "DEVICE_CERT");
  bool privateKeyValid = validateCertificate(runtimePrivateKey, "PRIVATE_KEY");
  
  certificatesLoaded = rootCaValid && deviceCertValid && privateKeyValid;

  if (!certificatesLoaded) {
    Serial.println("{\"aws_config_error\":{\"reason\":\"certificate_validation_failed\"}}");
    return;
  }

  // Configure TLS client
  if (USE_AWS_IOT) {
    logStatus("tls_configure_start");
    
    secureClient.setCACert(runtimeRootCa.c_str());
    secureClient.setCertificate(runtimeDeviceCert.c_str());
    secureClient.setPrivateKey(runtimePrivateKey.c_str());
    mqttClient.setServer(awsEndpoint.c_str(), AWS_IOT_PORT);
    
    logStatus("tls_configure_done");
  }

  Serial.print("{\"aws_config_applied\":{\"endpoint\":\"");
  Serial.print(awsEndpoint);
  Serial.print("\",\"port\":");
  Serial.print(AWS_IOT_PORT);
  Serial.print(",\"clientId\":\"");
  Serial.print(awsClientId);
  Serial.print("\",\"topic\":\"");
  Serial.print(awsTopic);
  Serial.print("\",\"rootCaLen\":");
  Serial.print(runtimeRootCa.length());
  Serial.print(",\"deviceCertLen\":");
  Serial.print(runtimeDeviceCert.length());
  Serial.print(",\"privateKeyLen\":");
  Serial.print(runtimePrivateKey.length());
  Serial.print(",\"certs_valid\":");
  Serial.print(certificatesLoaded ? "true" : "false");
  Serial.println("}}");
  
  logMemory();
  
  // Disconnect existing MQTT connection and reconnect with new config
  if (mqttClient.connected()) {
    logStatus("mqtt_disconnect", "applying_new_config");
    mqttClient.disconnect();
  }
  
  delay(1000);
  connectToAwsIot();
}

