'use client';

import { create } from 'zustand';

export interface TerminalStore {
  // State
  isOpen: boolean;
  sessionId: string;
  command: string;
  output: string[];
  isExecuting: boolean;

  // Actions
  open: () => void;
  close: () => void;
  setSessionId: (sessionId: string) => void;
  setCommand: (command: string) => void;
  addOutput: (line: string) => void;
  clearOutput: () => void;
  setIsExecuting: (isExecuting: boolean) => void;
  reset: () => void;
}

export const useTerminalStore = create<TerminalStore>((set) => ({
  isOpen: false,
  sessionId: '',
  command: '',
  output: [],
  isExecuting: false,

  open: () => set({ isOpen: true }),

  close: () => set({ isOpen: false }),

  setSessionId: (sessionId) => set({ sessionId }),

  setCommand: (command) => set({ command }),

  addOutput: (line) => set((state) => ({
    output: [...state.output, line].slice(-1000), // Keep last 1000 lines
  })),

  clearOutput: () => set({ output: [] }),

  setIsExecuting: (isExecuting) => set({ isExecuting }),

  reset: () => set({
    isOpen: false,
    sessionId: '',
    command: '',
    output: [],
    isExecuting: false,
  }),
}));
