import { useEffect, useRef, useState, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketHook {
  client: Client | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  subscribe: (destination: string, callback: (message: WebSocketMessage) => void) => StompSubscription | null;
  unsubscribe: (subscription: StompSubscription) => void;
  send: (destination: string, body: any) => void;
}

export const useWebSocket = (url: string = 'http://localhost:8081/ws'): WebSocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<Map<string, { subscription: StompSubscription; callback: (message: WebSocketMessage) => void }>>(new Map());

  const connect = useCallback(() => {
    if (clientRef.current?.connected) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      connectHeaders: {
        // Add authentication headers if needed
        // 'Authorization': `Bearer ${token}`
      },
      debug: (str) => {
        console.log('WebSocket Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('WebSocket connected');
      setIsConnected(true);

      // Re-subscribe to existing subscriptions
      subscriptionsRef.current.forEach((entry, destination) => {
        entry.subscription.unsubscribe();
        const newSubscription = client.subscribe(destination, (message) => {
          try {
            const parsedMessage = JSON.parse(message.body);
            entry.callback(parsedMessage);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        });
        subscriptionsRef.current.set(destination, { subscription: newSubscription, callback: entry.callback });
      });
    };

    client.onDisconnect = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    client.onStompError = (frame) => {
      console.error('WebSocket STOMP error:', frame.headers['message']);
      console.error('Details:', frame.body);
    };

    client.onWebSocketError = (error) => {
      console.error('WebSocket error:', error);
    };

    client.activate();
    clientRef.current = client;
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    subscriptionsRef.current.forEach((entry) => {
      entry.subscription.unsubscribe();
    });
    subscriptionsRef.current.clear();

    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const subscribe = useCallback((destination: string, callback: (message: WebSocketMessage) => void): StompSubscription | null => {
    if (!clientRef.current?.connected) {
      console.warn('WebSocket not connected, cannot subscribe');
      return null;
    }

    // Unsubscribe if already subscribed
    const existingEntry = subscriptionsRef.current.get(destination);
    if (existingEntry) {
      existingEntry.subscription.unsubscribe();
    }

    const subscription = clientRef.current.subscribe(destination, (message: IMessage) => {
      try {
        const parsedMessage = JSON.parse(message.body);
        callback(parsedMessage);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    subscriptionsRef.current.set(destination, { subscription, callback });
    return subscription;
  }, []);

  const unsubscribe = useCallback((subscription: StompSubscription) => {
    subscription.unsubscribe();
    // Remove from our tracking map
    for (const [destination, entry] of subscriptionsRef.current.entries()) {
      if (entry.subscription === subscription) {
        subscriptionsRef.current.delete(destination);
        break;
      }
    }
  }, []);

  const send = useCallback((destination: string, body: any) => {
    if (!clientRef.current?.connected) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    clientRef.current.publish({
      destination,
      body: JSON.stringify(body),
    });
  }, []);

  useEffect(() => {
    // Auto-connect on mount
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    client: clientRef.current,
    isConnected,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
  };
};
