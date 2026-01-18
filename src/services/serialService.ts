import { SerialPortInfo } from '../types';

class SerialService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private isConnected = false;

  /**
   * Check if Web Serial API is supported in the browser
   */
  isSupported(): boolean {
    return 'serial' in navigator;
  }

  /**
   * Request access to serial ports and return list of available ports
   */
  async requestPort(): Promise<SerialPort | null> {
    try {
      const port = await navigator.serial.requestPort();
      return port;
    } catch (error) {
      console.error('Error requesting serial port:', error);
      return null;
    }
  }

  /**
   * Get list of already granted serial ports
   */
  async getPorts(): Promise<SerialPortInfo[]> {
    try {
      const ports = await navigator.serial.getPorts();
      return ports.map((port, index) => ({
        port,
        name: `Serial Port ${index + 1}`
      }));
    } catch (error) {
      console.error('Error getting ports:', error);
      return [];
    }
  }

  /**
   * Connect to a specific serial port
   */
  async connect(port: SerialPort, baudRate: number = 115200): Promise<boolean> {
    try {
      await port.open({ baudRate });
      this.port = port;
      this.isConnected = true;

      // Set up reader and writer
      if (port.readable) {
        this.reader = port.readable.getReader();
      }
      if (port.writable) {
        this.writer = port.writable.getWriter();
      }

      return true;
    } catch (error) {
      console.error('Error connecting to port:', error);
      return false;
    }
  }

  /**
   * Disconnect from the current port
   */
  async disconnect(): Promise<void> {
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }

      if (this.writer) {
        this.writer.releaseLock();
        this.writer = null;
      }

      if (this.port) {
        await this.port.close();
        this.port = null;
      }

      this.isConnected = false;
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  /**
   * Write data to the serial port
   */
  async write(data: string): Promise<boolean> {
    if (!this.writer || !this.isConnected) {
      console.error('No writer available or not connected');
      return false;
    }

    try {
      const encoder = new TextEncoder();
      await this.writer.write(encoder.encode(data));
      return true;
    } catch (error) {
      console.error('Error writing to port:', error);
      return false;
    }
  }

  /**
   * Read data from the serial port
   */
  async read(callback: (data: string) => void): Promise<void> {
    if (!this.reader || !this.isConnected) {
      console.error('No reader available or not connected');
      return;
    }

    try {
      const decoder = new TextDecoder();
      while (this.isConnected) {
        const { value, done } = await this.reader.read();
        if (done) {
          break;
        }
        if (value) {
          const text = decoder.decode(value);
          callback(text);
        }
      }
    } catch (error) {
      console.error('Error reading from port:', error);
    }
  }

  /**
   * Test if port is accessible and responsive
   */
  async testPort(port: SerialPort): Promise<boolean> {
    try {
      const testSuccess = await this.connect(port);
      if (testSuccess) {
        // Send a test command
        await this.write('TEST\n');
        // Wait a bit for response (simplified for now)
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.disconnect();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Port test failed:', error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get current port
   */
  getCurrentPort(): SerialPort | null {
    return this.port;
  }
}

export const serialService = new SerialService();

