import React, { useState, useEffect, useCallback } from 'react';
import { Cpu, Upload, Wifi } from 'lucide-react';
import StatusIndicator from './StatusIndicator';
import { StatusType } from '../types';
import { serialService } from '../services/serialService';

interface ArduinoPanelProps {
  serialPortConnected: boolean;
  onStatusChange: (status: StatusType) => void;
}

const ArduinoPanel: React.FC<ArduinoPanelProps> = ({ serialPortConnected, onStatusChange }) => {
  const [arduinoStatus, setArduinoStatus] = useState<StatusType>('untested');
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [healthCheckActive, setHealthCheckActive] = useState(false);
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [isSendingWifi, setIsSendingWifi] = useState(false);

  const checkArduinoHealth = useCallback(async () => {
    if (!serialService.getConnectionStatus()) {
      setArduinoStatus('error');
      return;
    }

    try {
      // Send health check ping
      await serialService.write('PING\n');
      
      // Simulate Arduino response check
      // In real implementation, would wait for actual response
      setArduinoStatus('ready');
    } catch (error) {
      setArduinoStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!serialPortConnected) {
      setArduinoStatus('untested');
      setHealthCheckActive(false);
      return;
    }

    if (healthCheckActive) {
      const interval = setInterval(() => {
        checkArduinoHealth();
      }, 500); // Check every half second

      return () => clearInterval(interval);
    }
  }, [serialPortConnected, healthCheckActive, checkArduinoHealth]);

  useEffect(() => {
    onStatusChange(arduinoStatus);
  }, [arduinoStatus, onStatusChange]);

  const handleBootstrap = async () => {
    if (!serialPortConnected) {
      return;
    }

    setIsBootstrapping(true);
    setArduinoStatus('testing');

    try {
      // Simulate bootstrap code deployment
      await serialService.write('BOOTSTRAP\n');
      
      // Simulate deployment time
      await new Promise(resolve => setTimeout(resolve, 2000));

      setArduinoStatus('ready');
      setHealthCheckActive(true);
    } catch (error) {
      setArduinoStatus('error');
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleSendWifiConfig = async () => {
    if (!serialPortConnected || !wifiSsid.trim()) {
      return;
    }

    setIsSendingWifi(true);

    try {
      const payload = JSON.stringify({
        ssid: wifiSsid.trim(),
        password: wifiPassword
      });
      await serialService.write(`WIFI_CONFIG ${payload}\n`);
    } catch (error) {
      console.error('Failed to send WiFi config:', error);
    } finally {
      setIsSendingWifi(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-bold text-white">Arduino Configuration</h2>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-700 rounded">
          <p className="text-sm text-gray-300 mb-3">
            Deploy bootstrap code to Arduino Mega to enable communication with ESP32.
          </p>
          <button
            onClick={handleBootstrap}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
            disabled={!serialPortConnected || isBootstrapping}
          >
            <Upload className="w-4 h-4" />
            {isBootstrapping ? 'Deploying...' : 'Deploy Bootstrap Code'}
          </button>
        </div>

        <div className="p-4 bg-gray-700 rounded">
          <StatusIndicator status={arduinoStatus} label="Arduino Status" size="md" />
          {healthCheckActive && arduinoStatus === 'ready' && (
            <p className="text-xs text-green-400 mt-2">
              Health check active (polling every 500ms)
            </p>
          )}
        </div>

        <div className="p-4 bg-gray-700 rounded">
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-gray-300">ESP32 WiFi Configuration</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">WiFi SSID</label>
              <input
                type="text"
                className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm"
                placeholder="Enter WiFi network name"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                disabled={!serialPortConnected || isSendingWifi}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">WiFi Password</label>
              <input
                type="password"
                className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm"
                placeholder="Enter WiFi password"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                disabled={!serialPortConnected || isSendingWifi}
              />
            </div>
            <button
              onClick={handleSendWifiConfig}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
              disabled={!serialPortConnected || !wifiSsid.trim() || isSendingWifi}
            >
              {isSendingWifi ? 'Sending...' : 'Send WiFi Config to ESP32'}
            </button>
            <p className="text-xs text-gray-400">
              Credentials are sent over serial to Arduino and forwarded to ESP32.
            </p>
          </div>
        </div>

        {!serialPortConnected && (
          <div className="p-4 bg-yellow-900 border border-yellow-600 rounded text-yellow-200">
            <p className="text-sm">
              Please connect to a serial port first before configuring Arduino.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArduinoPanel;

