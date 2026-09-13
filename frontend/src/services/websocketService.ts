/**
 * WebSocket Real-Time Ingestion Service
 * Handles connection lifecycle, exponential backoff reconnects, event parsing, and event subscription.
 */

import {
  RealtimeWeatherEvent,
  RealtimeConnectionStatus,
  DemoPublishRequest,
  RealtimePipelineHealth,
} from '../types/realtime';

type EventCallback = (event: RealtimeWeatherEvent) => void;
type StatusCallback = (status: RealtimeConnectionStatus) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private status: RealtimeConnectionStatus = 'offline';
  private eventListeners: Set<EventCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private baseUrl: string;
  private wsUrl: string;
  private isExplicitlyClosed = false;

  constructor() {
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.baseUrl = rawApiUrl;
    
    // Derive WebSocket URL from HTTP API base URL
    const isHttps = rawApiUrl.startsWith('https');
    const hostWithPort = rawApiUrl.replace(/^https?:\/\//, '');
    const wsProtocol = isHttps ? 'wss:' : 'ws:';
    this.wsUrl = `${wsProtocol}//${hostWithPort}/ws/live-alerts`;
  }

  public getStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    this.setStatus(this.reconnectAttempts === 0 ? 'connecting' : 'reconnecting');

    try {
      const clientId = `client-${Math.random().toString(36).substring(2, 9)}`;
      const fullUrl = `${this.wsUrl}?client_id=${clientId}`;
      this.socket = new WebSocket(fullUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.startHeartbeat();
      };

      this.socket.onmessage = (messageEvent) => {
        try {
          const rawData = JSON.parse(messageEvent.data);
          if (rawData.type === 'pong') return;

          const now = Date.now();
          let latencyMs = 0;
          if (rawData.timestamp) {
            const eventTime = new Date(rawData.timestamp).getTime();
            if (!isNaN(eventTime) && now >= eventTime) {
              latencyMs = Math.round(now - eventTime);
            }
          }

          const weatherEvent: RealtimeWeatherEvent = {
            ...rawData,
            clientReceivedAt: now,
            latencyMs,
          };

          // Dispatch to all registered event listeners
          this.eventListeners.forEach((listener) => {
            try {
              listener(weatherEvent);
            } catch (err) {
              console.error('[WEBSOCKET] Error in event listener callback:', err);
            }
          });
        } catch (err) {
          console.error('[WEBSOCKET] Failed to parse incoming WebSocket message:', err);
        }
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        if (!this.isExplicitlyClosed) {
          this.setStatus('reconnecting');
          this.scheduleReconnect();
        } else {
          this.setStatus('offline');
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[WEBSOCKET] Socket connection error:', err);
        // Socket close event will trigger reconnection logic
      };
    } catch (err) {
      console.error('[WEBSOCKET] Exception initializing WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.isExplicitlyClosed) return;

    // Exponential backoff: 2s, 4s, 8s, 16s, max 30s
    this.reconnectAttempts++;
    const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send('ping');
        } catch {
          // ignore error
        }
      }
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('offline');
  }

  private setStatus(newStatus: RealtimeConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((listener) => {
        try {
          listener(newStatus);
        } catch (err) {
          console.error('[WEBSOCKET] Error in status callback:', err);
        }
      });
    }
  }

  public addEventListener(callback: EventCallback): () => void {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  public addStatusListener(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    // Immediately notify current status
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  // REST endpoints for demo trigger & health inspection
  public async publishDemoEvent(req: DemoPublishRequest): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/demo/publish-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      throw new Error(`Failed to publish demo event: ${res.statusText}`);
    }
    return res.json();
  }

  public async toggleDemoStream(enable?: boolean): Promise<{ is_demo_stream_active: boolean; message: string }> {
    const query = enable !== undefined ? `?enable=${enable}` : '';
    const res = await fetch(`${this.baseUrl}/api/demo/toggle-stream${query}`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Failed to toggle demo stream: ${res.statusText}`);
    }
    return res.json();
  }

  public async getHealth(): Promise<RealtimePipelineHealth> {
    const res = await fetch(`${this.baseUrl}/api/realtime/health`);
    if (!res.ok) {
      throw new Error(`Failed to fetch health status: ${res.statusText}`);
    }
    return res.json();
  }

  public async getHistory(eventType?: string, role?: string, limit = 50): Promise<RealtimeWeatherEvent[]> {
    const params = new URLSearchParams();
    if (eventType) params.append('event_type', eventType);
    if (role) params.append('role', role);
    params.append('limit', limit.toString());

    const res = await fetch(`${this.baseUrl}/api/realtime/history?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch history: ${res.statusText}`);
    }
    const data = await res.json();
    return data.events || [];
  }
}

export const websocketService = new WebSocketService();
