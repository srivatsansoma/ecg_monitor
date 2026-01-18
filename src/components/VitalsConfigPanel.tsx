import React, { useState, useEffect } from 'react';
import { Activity, Settings } from 'lucide-react';
import { VitalConfig } from '../types';
import { vitalsGenerator } from '../services/vitalsGenerator';

interface VitalsConfigPanelProps {
  isTransmitting: boolean;
}

const VitalsConfigPanel: React.FC<VitalsConfigPanelProps> = ({ isTransmitting }) => {
  const [configs, setConfigs] = useState<VitalConfig[]>([]);
  const [expandedVital, setExpandedVital] = useState<string | null>(null);

  useEffect(() => {
    setConfigs(vitalsGenerator.getAllConfigs());
  }, []);

  const handleConfigUpdate = (name: string, updates: Partial<VitalConfig>) => {
    vitalsGenerator.updateConfig(name, updates);
    setConfigs(vitalsGenerator.getAllConfigs());
  };

  const handleValueChange = (name: string, value: number) => {
    vitalsGenerator.setVitalValue(name, value);
    const config = vitalsGenerator.getConfig(name);
    if (config) {
      setConfigs(prev => prev.map(c => 
        c.name === name ? { ...c, currentValue: value } : c
      ));
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-6 h-6 text-green-400" />
        <h2 className="text-xl font-bold text-white">Vitals Configuration</h2>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {configs.map((config) => (
          <div key={config.name} className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => handleConfigUpdate(config.name, { enabled: e.target.checked })}
                  className="w-4 h-4"
                  disabled={isTransmitting}
                />
                <span className="text-white font-medium capitalize">
                  {config.name.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-gray-400 text-sm">{config.unit}</span>
              </div>
              <button
                onClick={() => setExpandedVital(expandedVital === config.name ? null : config.name)}
                className="text-gray-400 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {expandedVital === config.name && (
              <div className="mt-3 space-y-3 border-t border-gray-600 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Min Value</label>
                    <input
                      type="number"
                      value={config.min}
                      onChange={(e) => handleConfigUpdate(config.name, { min: parseFloat(e.target.value) })}
                      className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm"
                      disabled={isTransmitting}
                      step={config.name === 'ecg' ? '0.1' : '1'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Max Value</label>
                    <input
                      type="number"
                      value={config.max}
                      onChange={(e) => handleConfigUpdate(config.name, { max: parseFloat(e.target.value) })}
                      className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm"
                      disabled={isTransmitting}
                      step={config.name === 'ecg' ? '0.1' : '1'}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Frequency (Hz)</label>
                  <input
                    type="number"
                    value={config.frequency}
                    onChange={(e) => handleConfigUpdate(config.name, { frequency: parseFloat(e.target.value) })}
                    className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm"
                    disabled={isTransmitting}
                    step="0.1"
                    min="0.1"
                  />
                </div>

                {isTransmitting && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Current Value (Runtime Override)
                    </label>
                    <input
                      type="number"
                      value={config.currentValue ?? ''}
                      onChange={(e) => handleValueChange(config.name, parseFloat(e.target.value))}
                      placeholder="Auto-generated"
                      className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm"
                      step={config.name === 'ecg' ? '0.1' : '1'}
                      min={config.min}
                      max={config.max}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VitalsConfigPanel;

