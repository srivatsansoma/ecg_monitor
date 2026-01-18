import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Terminal } from 'lucide-react';
import { TransmissionLog, VitalsData } from '../types';
import { serialService } from '../services/serialService';
import { vitalsGenerator } from '../services/vitalsGenerator';
import { cloudService } from '../services/cloudService';

interface TransmissionPanelProps {
  canTransmit: boolean;
  transmissionFrequency: number; // in Hz
  serialMessages?: string[];
}

const TransmissionPanel: React.FC<TransmissionPanelProps> = ({
  canTransmit,
  transmissionFrequency,
  serialMessages = [],
}) => {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [logs, setLogs] = useState<TransmissionLog[]>([]);
  const [packetCount, setPacketCount] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const lastSerialIndexRef = useRef(0);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (type: TransmissionLog['type'], message: string, data?: any) => {
    const log: TransmissionLog = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };
    setLogs(prev => [...prev.slice(-99), log]); // Keep last 100 logs
  };

  const appendSerialLog = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    let logType: TransmissionLog['type'] = 'info';
    let message = trimmed;
    let data: any = undefined;

    const parseJson = (jsonString: string) => {
      try {
        return JSON.parse(jsonString);
      } catch {
        return null;
      }
    };

    if (trimmed.startsWith('ESP32_LOG ')) {
      const payload = parseJson(trimmed.replace('ESP32_LOG ', ''));
      if (payload) {
        data = payload;
        message = `ESP32: ${payload.status || 'message'}`;
        if (payload.status && String(payload.status).includes('error')) {
          logType = 'error';
        } else if (payload.status && String(payload.status).includes('sent')) {
          logType = 'success';
        } else {
          logType = 'info';
        }
      }
    } else if (trimmed.startsWith('{')) {
      const payload = parseJson(trimmed);
      if (payload) {
        data = payload;
        message = `Arduino: ${payload.status || 'message'}`;
        if (payload.status && String(payload.status).includes('error')) {
          logType = 'error';
        } else if (payload.status && String(payload.status).includes('forwarded')) {
          logType = 'success';
        } else {
          logType = 'info';
        }
      }
    }

    addLog(logType, message, data);
  };

  useEffect(() => {
    if (serialMessages.length === 0) {
      return;
    }

    const startIndex = lastSerialIndexRef.current;
    const newMessages = serialMessages.slice(startIndex);
    newMessages.forEach((line) => appendSerialLog(line));
    lastSerialIndexRef.current = serialMessages.length;
  }, [serialMessages]);

  const handleStart = () => {
    if (!canTransmit) {
      addLog('error', 'Cannot start transmission: not all connections are ready');
      return;
    }

    setIsTransmitting(true);
    setPacketCount(0);
    addLog('info', 'Starting data transmission...');

    const intervalMs = Math.floor(1000 / transmissionFrequency);
    
    vitalsGenerator.start(async (vitalsData: VitalsData) => {
      try {
        // Format as JSON payload
        const jsonPayload = JSON.stringify(vitalsData);
        
        // Send to serial port (Arduino)
        const serialSuccess = await serialService.write(jsonPayload + '\n');
        
        if (serialSuccess) {
          // Simulate sending to cloud via ESP32
        const cloudResult = await cloudService.sendData(vitalsData);
        
        if (cloudResult.ok) {
            setPacketCount(prev => prev + 1);
            addLog('success', `Packet sent successfully`, vitalsData);
          if (cloudResult.response) {
            addLog('info', 'Cloud response received', cloudResult.response);
          }
          } else {
          addLog('error', `Failed to send data to cloud`, cloudResult);
          }
        } else {
          addLog('error', 'Failed to write to serial port');
        }
      } catch (error) {
        addLog('error', `Transmission error: ${error}`);
      }
    }, intervalMs);
  };

  const handleStop = () => {
    vitalsGenerator.stop();
    setIsTransmitting(false);
    addLog('info', `Transmission stopped. Total packets sent: ${packetCount}`);
  };

  const getLogColor = (type: TransmissionLog['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-6 h-6 text-orange-400" />
          <h2 className="text-xl font-bold text-white">Transmission Control</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-400">Packets Sent</p>
            <p className="text-lg font-bold text-white">{packetCount}</p>
          </div>
          <div className="flex gap-2">
            {!isTransmitting ? (
              <button
                onClick={handleStart}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canTransmit}
              >
                <Play className="w-4 h-4" />
                Start
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Transmission Frequency: {transmissionFrequency} Hz ({1000/transmissionFrequency}ms interval)
        </label>
        <input
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          value={transmissionFrequency}
          disabled={isTransmitting}
          className="w-full"
          onChange={(e) => {
            // This would be passed back via props in real implementation
          }}
        />
      </div>

      <div className="bg-gray-900 rounded p-4 h-64 overflow-y-auto font-mono text-xs">
        {logs.length === 0 ? (
          <p className="text-gray-500">No transmission logs yet. Click Start to begin.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`mb-1 ${getLogColor(log.type)}`}>
              <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
              <span className="font-semibold">{log.type.toUpperCase()}</span>: {log.message}
              {log.data && (
                <div className="ml-4 text-gray-400 text-xs mt-1">
                  {JSON.stringify(log.data, null, 2)}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {!canTransmit && (
        <div className="mt-4 p-3 bg-yellow-900 border border-yellow-600 rounded text-yellow-200 text-sm">
          <p>Complete all connection configurations above before starting transmission.</p>
        </div>
      )}
    </div>
  );
};

export default TransmissionPanel;

