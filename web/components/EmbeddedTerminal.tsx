'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500';
  }
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:4500`;
}

interface EmbeddedTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

export default function EmbeddedTerminal({ isOpen, onClose, sessionId }: EmbeddedTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [currentCommand, setCurrentCommand] = useState('');
  const [apiUrl, setApiUrl] = useState('http://localhost:4500');
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Initialize API URL on mount
  useEffect(() => {
    setApiUrl(getApiUrl());
  }, []);

  useEffect(() => {
    if (!isOpen || !terminalRef.current) return;

    // Initialize terminal
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cyan: '#06b6d4',
        green: '#10b981',
        red: '#ef4444',
      },
      fontFamily: 'Menlo, Monaco, Courier New, monospace',
      fontSize: 13,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    fitAddonRef.current = fitAddon;

    // Add welcome message
    term.writeln('\x1b[36m╭─ AI Orchestrator Terminal\x1b[0m');
    term.writeln(`\x1b[36m├─ Session: ${sessionId || 'unknown'}\x1b[0m`);
    term.writeln(`\x1b[36m├─ Status: ✓ Ready\x1b[0m`);
    term.writeln(`\x1b[36m╰─ Type 'help' for commands\x1b[0m`);
    term.writeln('');
    term.write('$ ');

    // Handle user input
    term.onData((data) => {
      if (data === '\r') {
        // Enter key - execute command
        const command = currentCommand.trim();
        if (command) {
          term.writeln('');

          if (command.toLowerCase() === 'clear') {
            term.clear();
            term.write('$ ');
            setCurrentCommand('');
          } else if (command.toLowerCase() === 'help') {
            term.writeln('Available commands:');
            term.writeln('  help     - Show this help message');
            term.writeln('  clear    - Clear terminal');
            term.writeln('  exit     - Close terminal');
            term.writeln('');
            term.write('$ ');
            setCurrentCommand('');
          } else if (command.toLowerCase() === 'exit') {
            onClose();
          } else {
            // Send command via REST API
            (async () => {
              try {
                const response = await fetch(`${apiUrl}/api/cli/execute`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ command, session_id: sessionId }),
                });
                const result = await response.json();
                if (result.output) {
                  term.writeln(result.output);
                }
                term.write('$ ');
              } catch (error) {
                term.writeln(`\x1b[31m오류: ${error}\x1b[0m`);
                term.write('$ ');
              }
            })();
            setCurrentCommand('');
          }
        } else {
          term.writeln('');
          term.write('$ ');
        }
      } else if (data === '\u007f') {
        // Backspace
        if (currentCommand.length > 0) {
          setCurrentCommand(currentCommand.slice(0, -1));
          term.write('\b \b');
        }
      } else if (data >= String.fromCharCode(32) && data <= String.fromCharCode(126)) {
        // Printable character
        setCurrentCommand(currentCommand + data);
        term.write(data);
      }
    });

    setTerminal(term);

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [isOpen, sessionId, currentCommand, onClose, apiUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="h-3/4 w-3/4 max-w-4xl rounded-lg bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-900">CLI Terminal</h3>
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600">Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (terminal) {
                  terminal.clear();
                }
              }}
              className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Terminal */}
        <div
          ref={terminalRef}
          className="flex-1 overflow-hidden rounded-b-lg bg-gray-900"
        />

        {/* Info */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-2 text-xs text-gray-600">
          Type 'help' for commands | 'exit' to close
        </div>
      </div>
    </div>
  );
}
