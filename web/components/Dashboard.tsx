'use client';

import { useEffect, useState } from 'react';
import { useOrchestrateStore } from '@/lib/store/orchestrateStore';

function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500';
  }
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:4500`;
}

export default function Dashboard() {
  const { runId, status, progress, logs, updateProgress, addLog, setStatus } = useOrchestrateStore();
  const [apiUrl, setApiUrl] = useState('http://localhost:4500');

  // Initialize API URL on mount
  useEffect(() => {
    setApiUrl(getApiUrl());
  }, []);

  // Poll for status updates via REST API
  useEffect(() => {
    if (!runId || status === 'completed' || status === 'error') return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/orchestrate/${runId}/status`);
        if (response.ok) {
          const data = await response.json();

          // Update progress
          if (data.progress !== undefined) {
            updateProgress(data.progress);
          }

          // Check status
          if (data.status === 'completed') {
            setStatus('completed');
            addLog('✓ 작업 완료');
          } else if (data.status === 'error') {
            setStatus('error');
            addLog('✗ 작업 실패');
          }
        }
      } catch (error) {
        console.error('[Dashboard] Poll error:', error);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [runId, status, apiUrl, updateProgress, addLog, setStatus]);

  // Auto-scroll logs
  useEffect(() => {
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* 상태 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-sm font-medium text-gray-600">현재 상태</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 capitalize">
            {status === 'idle' ? '대기' : status === 'running' ? '실행 중' : status === 'completed' ? '완료' : '오류'}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-sm font-medium text-gray-600">진행률</div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900">{progress}%</div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-sm font-medium text-gray-600">실행 ID</div>
          <div className="mt-2 break-all font-mono text-sm text-gray-900">
            {runId || '-'}
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      {runId && status === 'completed' && (
        <div className="flex gap-3">
          <button className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">
            📥 결과 다운로드
          </button>
          <button className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
            📋 JSON 내보내기
          </button>
        </div>
      )}

      {/* 로그 뷰어 */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">실시간 로그</h3>
          {runId && (
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${status === 'running' ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-600">
                {status === 'running' ? '진행 중' : status === 'completed' ? '완료' : '대기 중'}
              </span>
            </div>
          )}
        </div>
        <div id="log-container" className="h-64 overflow-y-auto bg-gray-50 p-4">
          <div className="space-y-1 font-mono text-sm text-gray-700">
            {logs.length === 0 ? (
              <div className="text-gray-400">로그가 없습니다</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-gray-600">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
