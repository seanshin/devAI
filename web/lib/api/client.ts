import type { OrchestrateRequest, RagSearchQuery, RagSearchResult } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

// Export singleton instance
export const orchestratorClient = new OrchestratorClient();
