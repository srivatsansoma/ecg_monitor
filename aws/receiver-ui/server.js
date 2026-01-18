import fs from 'fs';
import path from 'path';
import http from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import { mqtt5, iot } from 'aws-iot-device-sdk-v2';

const __dirname = new URL('.', import.meta.url).pathname;

const CONFIG_PATH = process.env.AWS_CONFIG_PATH
  || path.resolve(__dirname, '../aws-config.json');

const PORT = Number(process.env.PORT || 5050);

function readAwsConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writePemFile(dir, name, content) {
  const filePath = path.join(dir, name);
  // Replace literal \n with actual newlines if needed
  const normalizedContent = content.replace(/\\n/g, '\n');
  fs.writeFileSync(filePath, normalizedContent, 'utf-8');
  return filePath;
}

function ensurePemFormat(value, label) {
  if (!value || typeof value !== 'string') {
    throw new Error(`Missing ${label} in aws-config.json`);
  }
  if (!value.includes('BEGIN') || !value.includes('END')) {
    throw new Error(`Invalid PEM format for ${label} (missing BEGIN/END)`);
  }
  return value;
}

function readPemValue(config, field, fallbackFile) {
  const inlineValue = config[field];
  if (inlineValue && typeof inlineValue === 'string' && inlineValue.trim().length > 0) {
    return ensurePemFormat(inlineValue, field);
  }

  const pathField = `${field}Path`;
  const filePath = config[pathField] || fallbackFile;
  if (filePath && fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return ensurePemFormat(content, field);
  }

  throw new Error(
    `Missing ${field}. Provide it inline in aws-config.json or add ${pathField} to point to a PEM file.`
  );
}

function createMqttClient(config) {
  const certDir = path.join(__dirname, '.certs');
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  console.log('Loading certificates...');
  const rootCa = readPemValue(config, 'rootCa', path.join(__dirname, '../AmazonRootCA1.pem'));
  const deviceCert = readPemValue(config, 'deviceCert', path.join(__dirname, '../ESP32PatientMonitor.cert.pem'));
  const privateKey = readPemValue(config, 'privateKey', path.join(__dirname, '../ESP32PatientMonitor.private.key'));

  console.log('Certificate lengths:', {
    rootCa: rootCa.length,
    deviceCert: deviceCert.length,
    privateKey: privateKey.length
  });

  const caPath = writePemFile(certDir, 'root-ca.pem', rootCa);
  const certPath = writePemFile(certDir, 'device-cert.pem', deviceCert);
  const keyPath = writePemFile(certDir, 'private-key.pem', privateKey);

  console.log('Certificate files written:', { caPath, certPath, keyPath });

  const endpoint = config.endpoint;
  const clientId = `receiver-ui-${Date.now()}`;

  console.log('Creating MQTT client:', { endpoint, clientId });

  try {
    const builder = iot.AwsIotMqtt5ClientConfigBuilder
      .newDirectMqttBuilderWithMtlsFromPath(endpoint, certPath, keyPath);
    
    builder.withCertificateAuthorityFromPath(undefined, caPath);
    
    const connectProps = {
      clientId: clientId,
      keepAliveIntervalSeconds: 30
    };
    
    builder.withConnectProperties(connectProps);

    console.log('Building MQTT client...');
    const mqttConfig = builder.build();
    const client = new mqtt5.Mqtt5Client(mqttConfig);
    console.log('MQTT client created successfully');
    return client;
  } catch (error) {
    console.error('Error creating MQTT client:', error.message);
    console.error('Verify:');
    console.error('1. Certificate files exist and are valid PEM format');
    console.error('2. Endpoint is correct:', endpoint);
    console.error('3. AWS IoT Policy allows client:', clientId);
    throw error;
  }
}

function safeJsonParse(payload) {
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

async function start() {
  const config = readAwsConfig();
  const topic = config.topic || 'hospital/vitals';

  const app = express();
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  const mqttClient = createMqttClient(config);

  mqttClient.on('messageReceived', (eventData) => {
    const payloadBytes = eventData.message.payload;
    const payloadText = payloadBytes ? Buffer.from(payloadBytes).toString('utf-8') : '';
    const parsed = safeJsonParse(payloadText);
    const message = {
      topic: eventData.message.topicName,
      receivedAt: new Date().toISOString(),
      payload: parsed,
    };
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  });

  mqttClient.on('connectionSuccess', () => {
    console.log('MQTT connected to AWS IoT Core');
  });

  mqttClient.on('connectionFailure', (data) => {
    console.error('MQTT connection failed', data.error);
  });

  mqttClient.on('disconnection', () => {
    console.warn('MQTT disconnected');
  });

  await mqttClient.start();
  await mqttClient.subscribe({
    subscriptions: [{ qos: mqtt5.QoS.AtLeastOnce, topicFilter: topic }]
  });

  server.listen(PORT, () => {
    console.log(`Receiver UI running at http://localhost:${PORT}`);
    console.log(`Subscribed to topic: ${topic}`);
  });
}

start().catch((err) => {
  console.error('Failed to start receiver UI', err);
  process.exit(1);
});

