'use client';

import { useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useOrchestrateStore } from '../store/orchestrateStore';

function getWsBaseUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:4500';
  // Use same origin as the page (Nginx will proxy /ws/* to backend)
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}`;
}

export interface OrchestrateWebSocketMessage {
  type: 'connected' | 'log' | 'progress' | 'complete' | 'error';
  data?: string;
  progress?: number;
  phase?: string;
  log?: string;
  message?: string;
  session_id?: string;
  result?: unknown;
  level?: string;
}

export function useOrchestrateWebSocket(sessionId: string) {
  const { addLog, updateProgress, setStatus } = useOrchestrateStore();
  const wsUrl = sessionId ? `${getWsBaseUrl()}/ws/orchestrate/${sessionId}` : '';

  const handleMessage = useCallback(
    (message: any) => {
      const msg = message as OrchestrateWebSocketMessage;
      switch (msg.type) {
        case 'log':
          addLog(String(msg.data ?? ''));
          break;

        case 'progress':
          updateProgress(Number(msg.progress ?? 0));
          if (msg.log) {
            addLog(String(msg.log));
          }
          break;

        case 'complete':
          setStatus('completed');
          addLog('✓ 워크플로우 완료');
          disconnect();
          break;

        case 'error':
          setStatus('error');
          addLog(`❌ ${String(msg.message ?? '오류 발생')}`);
          break;

        case 'connected':
          console.log('[OrchestrateWS] WebSocket connected');
          break;
      }
    },
    [addLog, updateProgress, setStatus]
  );

  const { send, disconnect } = useWebSocket({
    url: wsUrl,
    reconnect: false,
    onConnect: () => {
      console.log('[OrchestrateWS] Connected to orchestrator');
    },
    onDisconnect: () => {
      console.log('[OrchestrateWS] Disconnected from orchestrator');
    },
    onMessage: handleMessage,
    onError: () => {
      setStatus('error');
      addLog('❌ WebSocket 연결 오류');
    },
  });

  const startOrchestration = useCallback(
    (input: string, runId: string) => {
      console.log('[OrchestrateWS] Sending start message', { input, runId });
      send({ type: 'start', input, run_id: runId });
    },
    [send]
  );

  return { startOrchestration, disconnect };
}
