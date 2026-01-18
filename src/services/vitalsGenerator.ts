import { VitalConfig, VitalsData } from '../types';

export class VitalsGenerator {
  private configs: Map<string, VitalConfig> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs() {
    const defaultConfigs: VitalConfig[] = [
      { name: 'temperature', min: 36.0, max: 38.0, unit: '°C', frequency: 1, enabled: true },
      { name: 'bodyHeat', min: 36.0, max: 37.5, unit: '°C', frequency: 1, enabled: true },
      { name: 'heartRate', min: 60, max: 100, unit: 'bpm', frequency: 2, enabled: true },
      { name: 'ecg', min: -1, max: 1, unit: 'mV', frequency: 250, enabled: true },
      { name: 'systolicBP', min: 110, max: 130, unit: 'mmHg', frequency: 0.5, enabled: true },
      { name: 'diastolicBP', min: 70, max: 85, unit: 'mmHg', frequency: 0.5, enabled: true },
      { name: 'respiratoryRate', min: 12, max: 20, unit: 'breaths/min', frequency: 1, enabled: true },
      { name: 'spo2', min: 95, max: 100, unit: '%', frequency: 1, enabled: true },
      { name: 'etco2', min: 35, max: 45, unit: 'mmHg', frequency: 1, enabled: true },
      { name: 'cardiacOutput', min: 4.0, max: 8.0, unit: 'L/min', frequency: 0.5, enabled: true },
    ];

    defaultConfigs.forEach(config => {
      this.configs.set(config.name, config);
    });
  }

  updateConfig(name: string, updates: Partial<VitalConfig>) {
    const config = this.configs.get(name);
    if (config) {
      this.configs.set(name, { ...config, ...updates });
    }
  }

  getConfig(name: string): VitalConfig | undefined {
    return this.configs.get(name);
  }

  getAllConfigs(): VitalConfig[] {
    return Array.from(this.configs.values());
  }

  private generateValue(config: VitalConfig): number {
    // If currentValue is set (manual override), use it
    if (config.currentValue !== undefined) {
      return config.currentValue;
    }

    // Generate realistic values with some variation
    const range = config.max - config.min;
    const baseValue = config.min + (range * 0.5);
    const variation = (Math.random() - 0.5) * range * 0.3;
    const value = baseValue + variation;
    
    // Keep within bounds
    return Math.max(config.min, Math.min(config.max, value));
  }

  generateVitalsData(): VitalsData {
    const data: any = {
      timestamp: new Date().toISOString()
    };

    this.configs.forEach((config, name) => {
      if (config.enabled) {
        const value = this.generateValue(config);
        // Round to appropriate decimal places
        data[name] = name === 'ecg' ? parseFloat(value.toFixed(3)) : parseFloat(value.toFixed(1));
      }
    });

    return data as VitalsData;
  }

  start(callback: (data: VitalsData) => void, intervalMs: number = 1000) {
    if (this.isRunning) {
      console.warn('Generator is already running');
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      const data = this.generateVitalsData();
      callback(data);
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  isGenerating(): boolean {
    return this.isRunning;
  }

  // Update a specific vital's current value in real-time
  setVitalValue(name: string, value: number) {
    const config = this.configs.get(name);
    if (config) {
      config.currentValue = value;
    }
  }

  // Clear manual override and return to automatic generation
  clearVitalValue(name: string) {
    const config = this.configs.get(name);
    if (config) {
      config.currentValue = undefined;
    }
  }
}

export const vitalsGenerator = new VitalsGenerator();

