'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Don't connect if URL is empty
    if (!url) {
      console.log('[WebSocket] URL is empty, skipping connection');
      return;
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      console.log('[WebSocket] Attempting to connect to:', url);
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('[WebSocket] ✓ Connected successfully');
        reconnectCount.current = 0;
        onConnect?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', message.type);
          onMessage?.(message);
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', event.data);
        }
      };

      ws.current.onerror = (error) => {
        console.error('[WebSocket] ✗ Error event:', error);
        console.error('[WebSocket] ReadyState:', ws.current?.readyState);
        onError?.(error);
      };

      ws.current.onclose = () => {
        console.log('[WebSocket] Closed (readyState:', ws.current?.readyState, ')');
        onDisconnect?.();

        if (
          reconnect &&
          reconnectCount.current < maxReconnectAttempts
        ) {
          reconnectCount.current += 1;
          console.log(`[WebSocket] Reconnecting... (attempt ${reconnectCount.current}/${maxReconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(
            connect,
            reconnectInterval
          );
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      onError?.(error as Event);
    }
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnect, reconnectInterval, maxReconnectAttempts]);

  const send = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { send, disconnect, isConnected: ws.current?.readyState === WebSocket.OPEN };
}
