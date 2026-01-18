import React from 'react';
import { Circle, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { StatusType } from '../types';

interface StatusIndicatorProps {
  status: StatusType;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const getStatusIcon = () => {
    const iconSize = sizeClasses[size];
    switch (status) {
      case 'ready':
        return <CheckCircle2 className={`${iconSize} text-green-500`} />;
      case 'error':
        return <XCircle className={`${iconSize} text-red-500`} />;
      case 'warning':
        return <AlertCircle className={`${iconSize} text-yellow-500`} />;
      case 'testing':
        return <Loader2 className={`${iconSize} text-blue-500 animate-spin`} />;
      case 'untested':
      default:
        return <Circle className={`${iconSize} text-gray-500`} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Not Ready';
      case 'testing':
        return 'Testing...';
      case 'untested':
      default:
        return 'Untested';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusIcon()}
      <div className="flex flex-col">
        <span className={`${textSizeClasses[size]} font-medium text-gray-200`}>{label}</span>
        <span className={`${textSizeClasses[size]} text-gray-400`}>{getStatusText()}</span>
      </div>
    </div>
  );
};

export default StatusIndicator;

