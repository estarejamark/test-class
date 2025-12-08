import { useEffect, useState, useCallback } from 'react';
import { useWebSocket, WebSocketMessage } from './useWebSocket';
import { Quarter } from '@/types/api';
import { settingsService } from '@/services/settings.service';

export interface QuarterUpdateMessage extends WebSocketMessage {
  type: 'QUARTER_UPDATE' | 'SUBSCRIPTION_CONFIRMED';
  quarter?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  message?: string;
}

export interface QuarterData {
  quarter: Quarter;
  status: string;
  startDate: string;
  endDate: string;
  id: number;
  schoolYear?: {
    id: number;
    startDate: string;
    endDate: string;
    termType: string;
    isActive: boolean;
    isArchived: boolean;
    yearRange?: string;
  };
}

export interface QuarterUpdatesHook {
  quarters: Map<Quarter, QuarterData>;
  isConnected: boolean;
  lastUpdate: Date | null;
  subscribeToUpdates: () => void;
  unsubscribeFromUpdates: () => void;
}

export const useQuarterUpdates = (): QuarterUpdatesHook => {
  const { subscribe, unsubscribe, isConnected } = useWebSocket();
  const [quarters, setQuarters] = useState<Map<Quarter, QuarterData>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // --- Fetch initial active quarter from API ---
  useEffect(() => {
    const fetchActiveQuarter = async () => {
      const data = await settingsService.getActiveQuarter();
      if (!data) return;

      setQuarters(new Map([
        [data.activeQuarter, {
          quarter: data.activeQuarter,
          status: data.quarterDetails.status,
          startDate: data.quarterDetails.startDate,
          endDate: data.quarterDetails.endDate,
          id: data.quarterDetails.id,
          schoolYear: {
            // If you need schoolYear info, adjust accordingly
            id: 0, // placeholder
            startDate: '',
            endDate: '',
            termType: '',
            isActive: false,
            isArchived: false,
            yearRange: data.schoolYear || '',
          }
        }]
      ]));

      setLastUpdate(new Date());
    };

    fetchActiveQuarter();
  }, []);


  const handleQuarterUpdate = useCallback((message: WebSocketMessage) => {
    if (message.type === 'QUARTER_UPDATE' || message.type === 'SUBSCRIPTION_CONFIRMED') {
      const quarterMessage = message as QuarterUpdateMessage;

      if (quarterMessage.type === 'QUARTER_UPDATE') {
        setQuarters(prev => {
          const newQuarters = new Map(prev);
          const quarterKey = quarterMessage.quarter as Quarter || Quarter.Q1;

          newQuarters.set(quarterKey, {
            quarter: quarterKey,
            status: quarterMessage.status || 'UNKNOWN',
            startDate: quarterMessage.startDate || '',
            endDate: quarterMessage.endDate || '',
            id: (quarterMessage as any).id || 0,
            schoolYear: (quarterMessage as any).schoolYear,
          });

          return newQuarters;
        });
        setLastUpdate(new Date());
      }
    }
  }, []);

  const subscribeToUpdates = useCallback(() => {
    if (subscription) return;

    const newSubscription = subscribe('/topic/quarter-updates', handleQuarterUpdate);
    if (newSubscription) setSubscription(newSubscription);
  }, [subscribe, handleQuarterUpdate, subscription]);

  const unsubscribeFromUpdates = useCallback(() => {
    if (subscription) {
      unsubscribe(subscription);
      setSubscription(null);
    }
  }, [unsubscribe, subscription]);

  useEffect(() => {
    if (isConnected && !subscription) subscribeToUpdates();
    if (!isConnected && subscription) unsubscribeFromUpdates();
  }, [isConnected, subscription, subscribeToUpdates, unsubscribeFromUpdates]);

  useEffect(() => {
    return () => {
      if (subscription) unsubscribeFromUpdates();
    };
  }, [subscription, unsubscribeFromUpdates]);

  return { quarters, isConnected, lastUpdate, subscribeToUpdates, unsubscribeFromUpdates };
};
