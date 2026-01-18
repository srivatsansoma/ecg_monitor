export type StatusType = 'untested' | 'ready' | 'error' | 'warning' | 'testing';

export interface SerialPortInfo {
  port: SerialPort;
  name: string;
}

export interface VitalConfig {
  name: string;
  min: number;
  max: number;
  unit: string;
  frequency: number; // Hz
  enabled: boolean;
  currentValue?: number;
}

export interface VitalsData {
  temperature: number;
  bodyHeat: number;
  heartRate: number;
  ecg: number;
  systolicBP: number;
  diastolicBP: number;
  respiratoryRate: number;
  spo2: number;
  etco2: number;
  cardiacOutput: number;
  timestamp: string;
}

export interface ConnectionStatus {
  serialPort: StatusType;
  arduino: StatusType;
  cloud: StatusType;
}

export interface TransmissionLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: any;
}

export interface CloudEndpoint {
  provider: 'AWS IoT' | 'Azure IoT' | 'Google Cloud IoT' | 'Custom';
  url: string;
  credentials?: {
    apiKey?: string;
    clientId?: string;
    secret?: string;
  };
  aws?: {
    endpoint: string;
    clientId: string;
    topic: string;
    rootCa?: string;
    deviceCert?: string;
    privateKey?: string;
  };
}

