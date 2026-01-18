import React, { useState, useEffect, useRef } from 'react';
import { Cloud } from 'lucide-react';
import StatusIndicator from './StatusIndicator';
import { CloudEndpoint, StatusType } from '../types';
import { cloudService } from '../services/cloudService';
import { serialService } from '../services/serialService';

interface CloudEndpointPanelProps {
  onStatusChange: (status: StatusType) => void;
  onEndpointConfigured: (endpoint: CloudEndpoint) => void;
  serialPortConnected?: boolean;
}

const CloudEndpointPanel: React.FC<CloudEndpointPanelProps> = ({
  onStatusChange,
  onEndpointConfigured,
  serialPortConnected = false,
}) => {
  const [provider, setProvider] = useState<CloudEndpoint['provider']>('AWS IoT');
  const [url, setUrl] = useState('');
  const [awsEndpoint, setAwsEndpoint] = useState('');
  const [awsClientId, setAwsClientId] = useState('ESP32PatientMonitor');
  const [awsTopic, setAwsTopic] = useState('hospital/vitals');
  const [awsRootCa, setAwsRootCa] = useState('');
  const [awsDeviceCert, setAwsDeviceCert] = useState('');
  const [awsPrivateKey, setAwsPrivateKey] = useState('');
  const [awsConfigError, setAwsConfigError] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<StatusType>('untested');
  const [isTestimg, setIsTesting] = useState(false);
  const [isSendingAws, setIsSendingAws] = useState(false);
  const awsFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStatusChange(cloudStatus);
  }, [cloudStatus, onStatusChange]);

  const applyAwsConfig = (config: {
    endpoint?: string;
    clientId?: string;
    topic?: string;
    rootCa?: string;
    deviceCert?: string;
    privateKey?: string;
  }) => {
    if (config.endpoint !== undefined) setAwsEndpoint(config.endpoint);
    if (config.clientId !== undefined) setAwsClientId(config.clientId);
    if (config.topic !== undefined) setAwsTopic(config.topic);
    if (config.rootCa !== undefined) setAwsRootCa(config.rootCa);
    if (config.deviceCert !== undefined) setAwsDeviceCert(config.deviceCert);
    if (config.privateKey !== undefined) setAwsPrivateKey(config.privateKey);
    setCloudStatus('untested');
  };

  const handleAwsConfigFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setAwsConfigError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid JSON');
      }

      applyAwsConfig({
        endpoint: typeof parsed.endpoint === 'string' ? parsed.endpoint : undefined,
        clientId: typeof parsed.clientId === 'string' ? parsed.clientId : undefined,
        topic: typeof parsed.topic === 'string' ? parsed.topic : undefined,
        rootCa: typeof parsed.rootCa === 'string' ? parsed.rootCa : undefined,
        deviceCert: typeof parsed.deviceCert === 'string' ? parsed.deviceCert : undefined,
        privateKey: typeof parsed.privateKey === 'string' ? parsed.privateKey : undefined,
      });
    } catch (error) {
      setAwsConfigError('Failed to read AWS config JSON');
    } finally {
      if (awsFileInputRef.current) {
        awsFileInputRef.current.value = '';
      }
    }
  };

  const handleSendAwsConfig = async () => {
    if (!serialPortConnected) {
      setAwsConfigError('Connect a serial port before sending AWS config.');
      return;
    }

    if (!awsEndpoint.trim() || !awsClientId.trim() || !awsTopic.trim()) {
      setAwsConfigError('Endpoint, Client ID, and Topic are required.');
      return;
    }

    setAwsConfigError(null);
    setIsSendingAws(true);

    try {
      const payload = {
        endpoint: awsEndpoint.trim(),
        clientId: awsClientId.trim(),
        topic: awsTopic.trim(),
        rootCa: awsRootCa.trim() || undefined,
        deviceCert: awsDeviceCert.trim() || undefined,
        privateKey: awsPrivateKey.trim() || undefined,
      };
      await serialService.write(`AWS_CONFIG ${JSON.stringify(payload)}\n`);
    } catch (error) {
      setAwsConfigError('Failed to send AWS config over serial.');
    } finally {
      setIsSendingAws(false);
    }
  };

  const handleTestConnection = async () => {
    if (provider !== 'AWS IoT' && !url.trim()) {
      return;
    }

    const endpoint: CloudEndpoint = {
      provider,
      url: provider === 'AWS IoT' ? '' : url.trim(),
      aws: provider === 'AWS IoT' ? {
        endpoint: awsEndpoint.trim(),
        clientId: awsClientId.trim(),
        topic: awsTopic.trim(),
        rootCa: awsRootCa.trim() || undefined,
        deviceCert: awsDeviceCert.trim() || undefined,
        privateKey: awsPrivateKey.trim() || undefined,
      } : undefined,
    };

    setIsTesting(true);
    setCloudStatus('testing');

    try {
      const success = await cloudService.testConnection(endpoint);
      if (success) {
        cloudService.setEndpoint(endpoint);
        setCloudStatus('ready');
        onEndpointConfigured(endpoint);
      } else {
        setCloudStatus('error');
      }
    } catch (error) {
      setCloudStatus('error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Cloud className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">Cloud Endpoint Configuration</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cloud Provider
          </label>
          <select
            className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
            value={provider}
            onChange={(e) => setProvider(e.target.value as CloudEndpoint['provider'])}
            disabled={isTestimg}
          >
            <option value="AWS IoT">AWS IoT Core</option>
            <option value="Azure IoT">Azure IoT Hub</option>
            <option value="Google Cloud IoT">Google Cloud IoT Core</option>
            <option value="Custom">Custom Endpoint</option>
          </select>
        </div>

        {provider !== 'AWS IoT' && (
          <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Endpoint URL
          </label>
          <input
            type="text"
            className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="https://your-endpoint.region.amazonaws.com"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setCloudStatus('untested');
            }}
            disabled={isTestimg}
          />
          </div>
        )}

        {provider === 'AWS IoT' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Load settings from `aws/aws-config.json` (optional)
              </p>
              <div>
                <input
                  ref={awsFileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleAwsConfigFile}
                  className="hidden"
                />
                <button
                  onClick={() => awsFileInputRef.current?.click()}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                  disabled={isTestimg}
                >
                  Load from file
                </button>
              </div>
            </div>
            {awsConfigError && (
              <div className="p-2 bg-red-900 border border-red-600 rounded text-red-200 text-xs">
                {awsConfigError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                AWS IoT Endpoint
              </label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="xxxxxxxx-ats.iot.<region>.amazonaws.com"
                value={awsEndpoint}
                onChange={(e) => {
                  setAwsEndpoint(e.target.value);
                  setCloudStatus('untested');
                }}
                disabled={isTestimg}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client ID
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="ESP32PatientMonitor"
                  value={awsClientId}
                  onChange={(e) => {
                    setAwsClientId(e.target.value);
                    setCloudStatus('untested');
                  }}
                  disabled={isTestimg}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Topic
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="hospital/vitals"
                  value={awsTopic}
                  onChange={(e) => {
                    setAwsTopic(e.target.value);
                    setCloudStatus('untested');
                  }}
                  disabled={isTestimg}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amazon Root CA 1 (PEM)
              </label>
              <textarea
                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none h-24"
                placeholder="-----BEGIN CERTIFICATE-----"
                value={awsRootCa}
                onChange={(e) => {
                  setAwsRootCa(e.target.value);
                  setCloudStatus('untested');
                }}
                disabled={isTestimg}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Device Certificate (PEM)
              </label>
              <textarea
                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none h-24"
                placeholder="-----BEGIN CERTIFICATE-----"
                value={awsDeviceCert}
                onChange={(e) => {
                  setAwsDeviceCert(e.target.value);
                  setCloudStatus('untested');
                }}
                disabled={isTestimg}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Private Key (PEM)
              </label>
              <textarea
                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none h-24"
                placeholder="-----BEGIN PRIVATE KEY-----"
                value={awsPrivateKey}
                onChange={(e) => {
                  setAwsPrivateKey(e.target.value);
                  setCloudStatus('untested');
                }}
                disabled={isTestimg}
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={handleSendAwsConfig}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                disabled={
                  isSendingAws ||
                  isTestimg ||
                  !serialPortConnected ||
                  !awsEndpoint.trim() ||
                  !awsClientId.trim() ||
                  !awsTopic.trim()
                }
              >
                {isSendingAws ? 'Sending...' : 'Send AWS Config to ESP32'}
              </button>
              <span className="text-xs text-gray-400">
                Requires serial connection to Arduino
              </span>
            </div>
            <p className="text-xs text-gray-400">
              These parameters are for ESP32 MQTT/TLS configuration. The browser app does not publish to AWS IoT directly.
            </p>
          </div>
        )}

        <button
          onClick={handleTestConnection}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={
            isTestimg ||
            (provider !== 'AWS IoT' && !url.trim()) ||
            (provider === 'AWS IoT' && (!awsEndpoint.trim() || !awsClientId.trim() || !awsTopic.trim()))
          }
        >
          Test Connection
        </button>

        <div className="p-4 bg-gray-700 rounded">
          <StatusIndicator status={cloudStatus} label="Cloud Endpoint Status" size="md" />
        </div>

        <div className="p-4 bg-blue-900 border border-blue-600 rounded text-blue-200 text-sm">
          <p className="font-semibold mb-1">Note:</p>
          <p>
            This simulator supports testing connectivity to cloud IoT platforms.
            Ensure your endpoint URL is correct and accessible.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CloudEndpointPanel;

