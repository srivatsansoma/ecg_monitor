import { CloudEndpoint } from '../types';

class CloudService {
  private endpoint: CloudEndpoint | null = null;
  private isConnected = false;

  /**
   * Set cloud endpoint configuration
   */
  setEndpoint(endpoint: CloudEndpoint) {
    this.endpoint = endpoint;
  }

  /**
   * Get current endpoint
   */
  getEndpoint(): CloudEndpoint | null {
    return this.endpoint;
  }

  /**
   * Test connectivity to the cloud endpoint
   */
  async testConnection(endpoint: CloudEndpoint): Promise<boolean> {
    try {
      if (endpoint.provider === 'AWS IoT') {
        const aws = endpoint.aws;
        if (!aws) {
          return false;
        }
        if (!aws.endpoint || !aws.clientId || !aws.topic) {
          return false;
        }
        this.isConnected = true;
        return true;
      }

      // For AWS IoT, Azure IoT, Google Cloud IoT, we simulate the connection test
      // In a real implementation, this would use the respective SDK
      
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Basic URL validation
      if (!endpoint.url || endpoint.url.trim() === '') {
        return false;
      }

      // Try to parse as URL
      try {
        new URL(endpoint.url);
      } catch {
        return false;
      }

      // For now, simulate a successful connection
      // In production, this would make actual API calls to test connectivity
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Cloud connection test failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Simulate sending data to cloud endpoint
   */
  async sendData(data: any): Promise<{ ok: boolean; status?: number; response?: any; error?: string }> {
    if (!this.endpoint) {
      console.error('No endpoint configured');
      return { ok: false, error: 'no_endpoint' };
    }

    try {
      if (this.endpoint.provider === 'AWS IoT') {
        // Browser app does not publish to AWS IoT Core directly.
        // Data is forwarded via ESP32 using MQTT/TLS.
        return { ok: true, response: { status: 'aws_iot_via_esp32' } };
      }

      const response = await fetch(this.endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      let parsed: any = null;
      try {
        parsed = await response.json();
      } catch {
        parsed = await response.text();
      }

      if (!response.ok) {
        return { ok: false, status: response.status, response: parsed, error: 'http_error' };
      }

      return { ok: true, status: response.status, response: parsed };
    } catch (error) {
      console.error('Failed to send data to cloud:', error);
      return { ok: false, error: 'network_error' };
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from cloud
   */
  disconnect() {
    this.isConnected = false;
  }
}

export const cloudService = new CloudService();

