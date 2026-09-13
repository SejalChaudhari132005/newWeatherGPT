/**
 * Custom React Hook for Real-Time Weather Event Subscriptions & Role-Based Filtering
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RealtimeWeatherEvent,
  RealtimeConnectionStatus,
  DemoPublishRequest,
} from '../types/realtime';
import { websocketService } from '../services/websocketService';

interface UseRealtimeWeatherOptions {
  role?: string; // e.g. 'citizen' | 'farmer' | 'fisherman' | 'aviation' | 'disaster_manager' | 'urban_planner' | 'researcher'
  autoConnect?: boolean;
  maxEvents?: number;
}

export function useRealtimeWeather(options: UseRealtimeWeatherOptions = {}) {
  const { role, autoConnect = true, maxEvents = 50 } = options;

  const [status, setStatus] = useState<RealtimeConnectionStatus>(websocketService.getStatus());
  const [events, setEvents] = useState<RealtimeWeatherEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<RealtimeWeatherEvent | null>(null);
  const [unreadSevereAlerts, setUnreadSevereAlerts] = useState<number>(0);

  const roleRef = useRef(role);
  roleRef.current = role;

  useEffect(() => {
    if (autoConnect) {
      websocketService.connect();
    }

    // Subscribe to connection status changes
    const unsubStatus = websocketService.addStatusListener((newStatus) => {
      setStatus(newStatus);
    });

    // Subscribe to incoming weather events
    const unsubEvent = websocketService.addEventListener((event) => {
      const currentRole = roleRef.current;
      
      // If a role filter is specified, check if this event targets the role or is broadcast to all
      if (currentRole && event.targetRoles && event.targetRoles.length > 0) {
        if (!event.targetRoles.includes(currentRole) && !event.targetRoles.includes('all')) {
          // Event not relevant for current role
          return;
        }
      }

      setLatestEvent(event);
      setEvents((prev) => {
        // Prevent duplicates in UI list
        if (prev.some((e) => e.eventId === event.eventId)) {
          return prev;
        }
        return [event, ...prev].slice(0, maxEvents);
      });

      // Increment severe alert badge if event is ORANGE or RED severity
      if (event.severity === 'ORANGE' || event.severity === 'RED') {
        setUnreadSevereAlerts((prev) => prev + 1);
      }
    });

    // Initial load of recent events from backend buffer
    websocketService.getHistory(undefined, role, 20)
      .then((history) => {
        if (history && history.length > 0) {
          setEvents(history);
        }
      })
      .catch((err) => {
        console.debug('[REALTIME] History fetch skipped or offline:', err.message);
      });

    return () => {
      unsubStatus();
      unsubEvent();
    };
  }, [autoConnect, role, maxEvents]);

  const clearUnreadAlerts = useCallback(() => {
    setUnreadSevereAlerts(0);
  }, []);

  const publishDemo = useCallback(async (req: DemoPublishRequest) => {
    return await websocketService.publishDemoEvent(req);
  }, []);

  const toggleStream = useCallback(async (enable?: boolean) => {
    return await websocketService.toggleDemoStream(enable);
  }, []);

  return {
    status,
    events,
    latestEvent,
    unreadSevereAlerts,
    clearUnreadAlerts,
    publishDemo,
    toggleStream,
    reconnect: () => websocketService.connect(),
  };
}
