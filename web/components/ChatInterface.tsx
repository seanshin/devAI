'use client';

import { useState, useEffect } from 'react';
import { useOrchestrateStore } from '@/lib/store/orchestrateStore';
import { useTerminalStore } from '@/lib/store/terminalStore';
import EmbeddedTerminal from './EmbeddedTerminal';

function getApiUrl(): string {
  // Use environment variable if set, otherwise use current hostname
  if (typeof window === 'undefined') {
    // Server-side rendering
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500';
  }
  // Client-side: use current hostname with port 4500
  // This ensures both local development (localhost:4500) and production (172.237.14.73:4500) work
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:4500`;
}

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:4500');
  const { status, sessionId, runId, startExecution, setSessionId, addLog, setStatus } = useOrchestrateStore();
  const { isOpen: isTerminalOpen, open: openTerminal, close: closeTerminal } = useTerminalStore();

  // Initialize session ID and API URL on mount
  useEffect(() => {
    const newSessionId = `session-${Date.now()}`;
    setSessionId(newSessionId);
    // Set API URL based on current hostname
    setApiUrl(getApiUrl());
  }, [setSessionId]);

  // Poll for status updates via REST API
  useEffect(() => {
    if (!runId || status === 'completed' || status === 'error') return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/orchestrate/${runId}/status`);
        if (response.ok) {
          const data = await response.json();
          console.log('[ChatInterface] Status response:', data);

          // Update progress if available
          if (data.progress !== undefined) {
            // Progress update logic
          }

          // Check if completed
          if (data.status === 'completed') {
            setStatus('completed');
            addLog('✓ 작업 완료');
          }
        }
      } catch (error) {
        console.error('[ChatInterface] Poll error:', error);
      }
    };

    const interval = setInterval(pollStatus, 2000); // Poll every 2 seconds
    pollStatus(); // Initial poll
    return () => clearInterval(interval);
  }, [runId, status, apiUrl, addLog, setStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      addLog(`▶️ 실행 중: ${input.trim()}`);

      // Call orchestrator API
      console.log('[ChatInterface] Calling orchestrator API:', `${apiUrl}/api/orchestrate`);
      const response = await fetch(`${apiUrl}/api/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input.trim(),
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[ChatInterface] API response:', result);
      const runId = result.run_id || result.runId;

      if (!runId) {
        throw new Error('No run_id in response');
      }

      // Start execution and polling
      startExecution(runId);
      addLog(`✓ 실행 시작됨 (ID: ${runId})`);
      setInput('');
    } catch (error) {
      console.error('[ChatInterface] Failed to orchestrate:', error);
      addLog(`❌ 오류: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 채팅 입력 영역 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="input" className="block text-sm font-medium text-gray-700">
              자연어 입력
            </label>
            <textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="예: FastAPI 기반 사용자 인증 시스템 만들어줘"
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                const sessionId = `session-${Date.now()}`;
                setSessionId(sessionId);
                openTerminal();
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isLoading}
            >
              터미널 열기
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoading || status === 'running'}
              >
                {isLoading ? '처리 중...' : '실행'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 샘플 프롬프트 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium text-gray-900">샘플 프롬프트</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            'FastAPI 기반 사용자 인증 시스템',
            'React 컴포넌트 라이브러리',
            'Docker 배포 스크립트',
            '데이터베이스 마이그레이션',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="rounded-lg border border-gray-200 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Terminal */}
      <EmbeddedTerminal
        isOpen={isTerminalOpen}
        onClose={closeTerminal}
        sessionId={sessionId}
      />
    </div>
  );
}
