import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';
import SerialPortPanel from './components/SerialPortPanel';
import ArduinoPanel from './components/ArduinoPanel';
import CloudEndpointPanel from './components/CloudEndpointPanel';
import PathwayStatus from './components/PathwayStatus';
import VitalsConfigPanel from './components/VitalsConfigPanel';
import TransmissionPanel from './components/TransmissionPanel';
import TestEndpointPanel from './components/TestEndpointPanel';
import { ConnectionStatus, StatusType, CloudEndpoint } from './types';
import { serialService } from './services/serialService';

function App() {
  const [serialPortStatus, setSerialPortStatus] = useState<StatusType>('untested');
  const [arduinoStatus, setArduinoStatus] = useState<StatusType>('untested');
  const [cloudStatus, setCloudStatus] = useState<StatusType>('untested');
  const [connectedPort, setConnectedPort] = useState<SerialPort | null>(null);
  const [cloudEndpoint, setCloudEndpoint] = useState<CloudEndpoint | null>(null);
  const [transmissionFrequency, setTransmissionFrequency] = useState(1); // 1 Hz default
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [serialMessages, setSerialMessages] = useState<string[]>([]);
  const serialBufferRef = useRef('');

  const connectionStatus: ConnectionStatus = {
    serialPort: serialPortStatus,
    arduino: arduinoStatus,
    cloud: cloudStatus
  };

  const canTransmit = 
    serialPortStatus === 'ready' && 
    arduinoStatus === 'ready' && 
    cloudStatus === 'ready';

  const handleSerialPortStatusChange = useCallback((status: StatusType) => {
    setSerialPortStatus(status);
  }, []);

  const handleArduinoStatusChange = useCallback((status: StatusType) => {
    setArduinoStatus(status);
  }, []);

  const handleCloudStatusChange = useCallback((status: StatusType) => {
    setCloudStatus(status);
  }, []);

  const handlePortConnected = useCallback((port: SerialPort) => {
    setConnectedPort(port);
  }, []);

  const handleEndpointConfigured = useCallback((endpoint: CloudEndpoint) => {
    setCloudEndpoint(endpoint);
  }, []);

  useEffect(() => {
    if (serialPortStatus !== 'ready') {
      return;
    }

    serialService.read((data) => {
      serialBufferRef.current += data;
      const lines = serialBufferRef.current.split('\n');
      serialBufferRef.current = lines.pop() ?? '';

      const cleaned = lines
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (cleaned.length > 0) {
        setSerialMessages((prev) => [...prev.slice(-200), ...cleaned]);
      }
    });
  }, [serialPortStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Heart className="w-10 h-10 text-red-500 animate-pulse" />
            <h1 className="text-4xl font-bold text-white">
              Hospital Patient Monitoring Simulator
            </h1>
          </div>
          <p className="text-gray-400">
            IoT-based patient vitals monitoring system with Arduino Mega, ESP32, and Cloud Integration
          </p>
        </div>

        {/* Pathway Status - Always visible at top */}
        <div className="mb-6">
          <PathwayStatus status={connectionStatus} />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Connection Configs */}
          <div className="space-y-6">
            <SerialPortPanel 
              onStatusChange={handleSerialPortStatusChange}
              onPortConnected={handlePortConnected}
            />
            
            <ArduinoPanel 
              serialPortConnected={serialPortStatus === 'ready'}
              onStatusChange={handleArduinoStatusChange}
            />
            
            <CloudEndpointPanel 
              onStatusChange={handleCloudStatusChange}
              onEndpointConfigured={handleEndpointConfigured}
              serialPortConnected={serialPortStatus === 'ready'}
            />
          </div>

          {/* Right Column - Vitals and Transmission */}
          <div className="space-y-6">
            <VitalsConfigPanel isTransmitting={isTransmitting} />
            <TestEndpointPanel cloudEndpoint={cloudEndpoint} />
          </div>
        </div>

        {/* Transmission Panel - Full Width */}
        <div className="mb-6">
          <TransmissionPanel 
            canTransmit={canTransmit}
            transmissionFrequency={transmissionFrequency}
            serialMessages={serialMessages}
          />
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>
            Using Web Serial API for Arduino communication | Chrome/Edge recommended | 
            Requires HTTPS or localhost
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;

