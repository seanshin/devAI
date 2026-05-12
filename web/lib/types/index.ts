// Orchestrator API 타입
export interface OrchestrateRequest {
  input: string;
  sessionId?: string;
}

export interface OrchestrateResponse {
  runId: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

export interface ExecutionStatus {
  runId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  logs: string[];
  result?: Record<string, unknown>;
}

export interface ExecutionHistory {
  runId: string;
  input: string;
  status: 'completed' | 'failed';
  createdAt: string;
  completedAt: string;
  duration: number;
}

// RAG API 타입
export interface RagSearchQuery {
  query: string;
  limit?: number;
}

export interface RagSearchResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

// CLI 타입
export interface CliCommand {
  command: string;
  sessionId: string;
}

export interface CliOutput {
  type: 'stdout' | 'stderr' | 'exit';
  data: string;
  timestamp: string;
}
