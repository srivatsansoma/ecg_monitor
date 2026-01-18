import React, { useState, useEffect } from 'react';
import { Usb, RefreshCw } from 'lucide-react';
import StatusIndicator from './StatusIndicator';
import { serialService } from '../services/serialService';
import { SerialPortInfo, StatusType } from '../types';

interface SerialPortPanelProps {
  onStatusChange: (status: StatusType) => void;
  onPortConnected: (port: SerialPort) => void;
}

const SerialPortPanel: React.FC<SerialPortPanelProps> = ({ onStatusChange, onPortConnected }) => {
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<SerialPort | null>(null);
  const [portStatus, setPortStatus] = useState<StatusType>('untested');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPorts();
  }, []);

  useEffect(() => {
    onStatusChange(portStatus);
  }, [portStatus, onStatusChange]);

  const loadPorts = async () => {
    const availablePorts = await serialService.getPorts();
    setPorts(availablePorts);
  };

  const handleRequestPort = async () => {
    const port = await serialService.requestPort();
    if (port) {
      await loadPorts();
      setSelectedPort(port);
      setPortStatus('untested');
    }
  };

  const handleTestPort = async () => {
    if (!selectedPort) {
      return;
    }

    setIsLoading(true);
    setPortStatus('testing');

    try {
      const success = await serialService.testPort(selectedPort);
      if (success) {
        setPortStatus('ready');
        onPortConnected(selectedPort);
      } else {
        setPortStatus('error');
      }
    } catch (error) {
      setPortStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedPort) {
      return;
    }

    setIsLoading(true);
    setPortStatus('testing');

    try {
      const success = await serialService.connect(selectedPort);
      if (success) {
        setPortStatus('ready');
        onPortConnected(selectedPort);
      } else {
        setPortStatus('error');
      }
    } catch (error) {
      setPortStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Usb className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-bold text-white">Serial Port Configuration</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Serial Port
          </label>
          <div className="flex gap-2">
            <select
              className="flex-1 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
              onChange={(e) => {
                const portIndex = parseInt(e.target.value);
                if (portIndex >= 0) {
                  setSelectedPort(ports[portIndex].port);
                  setPortStatus('untested');
                }
              }}
              disabled={isLoading}
            >
              <option value="-1">Select a port...</option>
              {ports.map((portInfo, index) => (
                <option key={index} value={index}>
                  {portInfo.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleRequestPort}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4" />
              Add Port
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleTestPort}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={!selectedPort || isLoading}
          >
            Test Port
          </button>
          <button
            onClick={handleConnect}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={!selectedPort || isLoading}
          >
            Connect
          </button>
        </div>

        <div className="mt-4 p-4 bg-gray-700 rounded">
          <StatusIndicator status={portStatus} label="Serial Port Status" size="md" />
        </div>

        {!serialService.isSupported() && (
          <div className="mt-4 p-4 bg-red-900 border border-red-600 rounded text-red-200">
            <p className="font-semibold">Web Serial API Not Supported</p>
            <p className="text-sm mt-1">
              Please use Chrome, Edge, or Opera browser with HTTPS or localhost.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SerialPortPanel;

