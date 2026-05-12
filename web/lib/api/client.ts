import type { OrchestrateRequest, RagSearchQuery, RagSearchResult } from '../types';

function getApiBase(): string {
  // Server-side rendering
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500';
  }
  // Client-side: use current hostname with port 4500
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:4500`;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500';

export class OrchestratorClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Start orchestration with natural language input
   */
  async orchestrate(request: OrchestrateRequest) {
    const response = await fetch(`${this.baseUrl}/api/orchestrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get execution status
   */
  async getStatus(runId: string) {
    const response = await fetch(`${this.baseUrl}/api/orchestrate/${runId}/status`);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get execution history
   */
  async getHistory(limit: number = 50) {
    const response = await fetch(`${this.baseUrl}/api/orchestrate/history?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search using RAG
   */
  async ragSearch(query: RagSearchQuery): Promise<RagSearchResult[]> {
    const response = await fetch(`${this.baseUrl}/api/rag/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Execute CLI command
   */
  async executeCommand(command: string, sessionId: string) {
    const response = await fetch(`${this.baseUrl}/api/cli/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, sessionId }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }
}

// Factory function for creating a client with dynamic API URL
export function createOrchestratorClient(): OrchestratorClient {
  return new OrchestratorClient(getApiBase());
}

// Export singleton instance (uses static API_BASE for backward compatibility)
export const orchestratorClient = new OrchestratorClient();
