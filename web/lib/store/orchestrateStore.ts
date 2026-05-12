'use client';

import { create } from 'zustand';
import type { ExecutionStatus, ExecutionHistory } from '../types';

export interface OrchestrateStore {
  // State
  runId: string | null;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  logs: string[];
  sessionId: string;
  history: ExecutionHistory[];

  // Actions
  startExecution: (runId: string) => void;
  updateProgress: (progress: number) => void;
  addLog: (log: string) => void;
  setStatus: (status: 'idle' | 'running' | 'completed' | 'error') => void;
  setSessionId: (sessionId: string) => void;
  addHistory: (item: ExecutionHistory) => void;
  reset: () => void;
}

export const useOrchestrateStore = create<OrchestrateStore>((set) => ({
  runId: null,
  status: 'idle',
  progress: 0,
  logs: [],
  sessionId: '',
  history: [],

  startExecution: (runId) => set({
    runId,
    status: 'running',
    progress: 0,
    logs: []
  }),

  updateProgress: (progress) => set({ progress: Math.min(progress, 100) }),

  addLog: (log) => set((state) => ({
    logs: [...state.logs, `[${new Date().toLocaleTimeString()}] ${log}`]
  })),

  setStatus: (status) => set({ status }),

  setSessionId: (sessionId) => set({ sessionId }),

  addHistory: (item) => set((state) => ({
    history: [item, ...state.history].slice(0, 50) // Keep last 50
  })),

  reset: () => set({
    runId: null,
    status: 'idle',
    progress: 0,
    logs: []
  }),
}));
