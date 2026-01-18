import React from 'react';
import { ArrowRight, CheckCircle2, XCircle, AlertCircle, Circle } from 'lucide-react';
import { ConnectionStatus, StatusType } from '../types';

interface PathwayStatusProps {
  status: ConnectionStatus;
}

const PathwayStatus: React.FC<PathwayStatusProps> = ({ status }) => {
  const getStatusIcon = (statusType: StatusType) => {
    switch (statusType) {
      case 'ready':
        return <CheckCircle2 className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-8 h-8 text-yellow-500" />;
      case 'testing':
        return <Circle className="w-8 h-8 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="w-8 h-8 text-gray-500" />;
    }
  };

  const allReady = status.serialPort === 'ready' && 
                   status.arduino === 'ready' && 
                   status.cloud === 'ready';

  const hasError = status.serialPort === 'error' || 
                   status.arduino === 'error' || 
                   status.cloud === 'error';

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">Communication Pathway Status</h2>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col items-center">
          {getStatusIcon(status.serialPort)}
          <span className="text-sm text-gray-300 mt-2">Web App</span>
          <span className="text-xs text-gray-400">Serial Port</span>
        </div>

        <ArrowRight className="w-6 h-6 text-gray-500" />

        <div className="flex flex-col items-center">
          {getStatusIcon(status.arduino)}
          <span className="text-sm text-gray-300 mt-2">Arduino</span>
          <span className="text-xs text-gray-400">Mega + ESP32</span>
        </div>

        <ArrowRight className="w-6 h-6 text-gray-500" />

        <div className="flex flex-col items-center">
          {getStatusIcon(status.cloud)}
          <span className="text-sm text-gray-300 mt-2">Cloud</span>
          <span className="text-xs text-gray-400">IoT Platform</span>
        </div>
      </div>

      <div className={`p-4 rounded ${allReady ? 'bg-green-900 border border-green-600' : hasError ? 'bg-red-900 border border-red-600' : 'bg-gray-700 border border-gray-600'}`}>
        <p className={`font-semibold ${allReady ? 'text-green-200' : hasError ? 'text-red-200' : 'text-gray-300'}`}>
          {allReady ? '✓ All Systems Ready' : hasError ? '✗ Connection Error' : 'ⓘ Configuring...'}
        </p>
        <p className={`text-sm mt-1 ${allReady ? 'text-green-300' : hasError ? 'text-red-300' : 'text-gray-400'}`}>
          {allReady 
            ? 'Communication pathway is fully operational. Ready to transmit data.' 
            : hasError 
            ? 'One or more connections have failed. Please check the configuration above.'
            : 'Please configure all connections to enable data transmission.'}
        </p>
      </div>
    </div>
  );
};

export default PathwayStatus;

