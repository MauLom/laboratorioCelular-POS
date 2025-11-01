// Device Tracker API Service
// Centralizes all communication with the Windows service for device tracking

const WIN_SERVICE_URL = process.env.REACT_APP_WIN_SERVICE_URL || 'http://localhost:5005';
const DEFAULT_TIMEOUT = 3000;

interface SystemGuidResponse {
  guid?: string;
  systemGuid?: string;
}

interface PrinterListResponse {
  printers: string[];
}

interface PrintTicketRequest {
  printerName: string;
  content: string;
  [key: string]: any;
}

// Helper function to make requests with timeout
const makeRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${WIN_SERVICE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// System GUID with caching
let cachedGuid: string | null = null;
let guidLastFetch: number = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

export const deviceTrackerApi = {
  /**
   * Get system GUID with caching
   */
  getSystemGuid: async (): Promise<string | null> => {
    const now = Date.now();
    
    // Return cached GUID if available and not expired
    if (cachedGuid && (now - guidLastFetch) < CACHE_DURATION) {
      return cachedGuid;
    }

    try {
      const response = await makeRequest<SystemGuidResponse>('/api/system/guid');
      const guid = response.guid || response.systemGuid || null;
      
      // Update cache
      cachedGuid = guid;
      guidLastFetch = now;
      
      return guid;
    } catch (error) {
      console.error('Error fetching system GUID:', error);
      return null;
    }
  },

  /**
   * Get list of available printers
   */
  getPrinterList: async (): Promise<string[]> => {
    try {
      const response = await makeRequest<PrinterListResponse>('/api/printer/list');
      return response.printers || [];
    } catch (error) {
      console.error('Error fetching printer list:', error);
      return [];
    }
  },

  /**
   * Test printer connection
   */
  testPrinter: async (printerName: string): Promise<boolean> => {
    try {
      await makeRequest(`/api/printer/test?printerName=${encodeURIComponent(printerName)}`, {
        method: 'GET'
      });
      return true;
    } catch (error) {
      console.error('Error testing printer:', error);
      return false;
    }
  },

  /**
   * Print ticket to specified printer
   */
  printTicket: async (ticketData: PrintTicketRequest): Promise<boolean> => {
    try {
      await makeRequest('/api/printer/ticket', {
        method: 'POST',
        body: JSON.stringify(ticketData),
      });
      return true;
    } catch (error) {
      console.error('Error printing ticket:', error);
      return false;
    }
  },

  /**
   * Clear GUID cache (useful for testing or when service restarts)
   */
  clearGuidCache: (): void => {
    cachedGuid = null;
    guidLastFetch = 0;
  },

  /**
   * Check if service is available
   */
  isServiceAvailable: async (): Promise<boolean> => {
    try {
      await makeRequest('/api/system/guid', {}, 1000); // Quick 1s timeout
      return true;
    } catch (error) {
      return false;
    }
  }
};

export default deviceTrackerApi;