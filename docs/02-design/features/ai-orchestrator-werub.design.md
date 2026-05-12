# 설계서: AI 오케스트레이터 Web Dashboard (WeRU.B Server 기반)

**프로젝트명**: AI Orchestrator Web Dashboard - WeRU.B Server Integration  
**버전**: 3.4 (WeRU.B Integration)  
**작성일**: 2026-05-12  
**기반 서버**: WeRU.B AI Server v2.33.0 (`https://weve.io.kr/ollama`)  
**상태**: 설계 단계 (Design Phase - 기존 서버 활용)

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [아키텍처](#2-아키텍처)
3. [Web Client 설계](#3-web-client-설계-nextjs)
4. [Proxy Layer 설계](#4-proxy-layer-설계-fastapi-최소화)
5. [Embedded CLI 통합](#5-embedded-cli-통합)
6. [API 통합 가이드](#6-api-통합-가이드)
7. [배포 및 설정](#7-배포-및-설정)

---

## 1. 시스템 개요

### 1.1 WeRU.B Server 활용

```
WeRU.B AI Server의 기존 인프라 활용:

✅ Orchestrator API (7개) - 자동 워크플로우 실행
  POST /api/orchestrator/chat ⭐ 자연어 → 워크플로우 자동 선택

✅ LLM 엔진 (8개) - qwen2.5:14b 중심
  - 한국어 99% 지원
  - 코딩 특화 모델
  - 의료 AI 모델

✅ Queue 배치 (16개) - 대량 작업 처리
  POST /api/queue/submit
  GET /api/queue/status

✅ RAG 시스템 (5개) - 벡터 기반 검색
  POST /api/rag/search
  POST /api/rag/ask

✅ 인프라
  - RTX 5080 16GB GPU
  - ChromaDB (bge-m3, nomic-embed)
  - SQLite WAL (고성능)
```

### 1.2 우리의 추가 계층

```
우리가 구현할 부분:

1️⃣ Web Dashboard (Next.js)
   └─ 사용자 인터페이스
   └─ 실시간 모니터링
   └─ Embedded Terminal

2️⃣ Proxy Layer (FastAPI - 최소화)
   └─ API 라우팅 및 인증
   └─ 세션 관리
   └─ WebSocket 브리지

3️⃣ CLI 통합
   └─ 웹에서 Terminal 실행
   └─ 명령 실행 및 로그 스트리밍
```

---

## 2. 아키텍처

### 2.1 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│           Web Client (Next.js)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ Dashboard    │  │ Orchestrate  │  │ Embedded Term  │   │
│  │ (실시간)     │  │ (채팅)       │  │ (CLI실행)      │   │
│  └──────────────┘  └──────────────┘  └────────────────┘   │
│         ↓                  ↓                  ↓             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Proxy Layer (FastAPI)                             │   │
│  │  ├─ API 라우팅 → WeRU.B Server                   │   │
│  │  ├─ 인증 (Bearer token)                          │   │
│  │  ├─ WebSocket Bridge (SSE ↔ WS)                 │   │
│  │  └─ 세션 관리 (Redis)                            │   │
│  └────────┬────────────────────────────────────────┘   │
└───────────┼─────────────────────────────────────────────┘
            │ (HTTPS)
            ↓
  ╔═════════════════════════════════════════════════════╗
  ║    WeRU.B AI Server (v2.33.0)                      ║
  ║    https://weve.io.kr/ollama                       ║
  ╠═════════════════════════════════════════════════════╣
  ║                                                     ║
  ║  📡 Orchestrator                                   ║
  ║    /api/orchestrator/chat (자연어 → 워크플로우)   ║
  ║    /api/orchestrator/run/stream (SSE 스트리밍)   ║
  ║                                                     ║
  ║  🧠 LLM (qwen2.5:14b, coding, medical)             ║
  ║    /api/generate, /api/chat                        ║
  ║                                                     ║
  ║  📊 Queue                                          ║
  ║    /api/queue/submit, /api/queue/status            ║
  ║                                                     ║
  ║  🔍 RAG                                            ║
  ║    /api/rag/search, /api/rag/ask                   ║
  ║                                                     ║
  ║  💾 Storage (ChromaDB, SQLite)                     ║
  ║                                                     ║
  ╚═════════════════════════════════════════════════════╝
```

### 2.2 통신 흐름

```
시나리오: 사용자가 웹에서 "FastAPI 만들어줘" 입력

1️⃣ 웹 → Proxy
   POST /api/orchestrate
   { "input": "FastAPI 만들어줘" }

2️⃣ Proxy → WeRU.B
   POST https://weve.io.kr/ollama/api/orchestrator/chat
   Authorization: Bearer sk-xxx
   { "message": "FastAPI 만들어줘" }

3️⃣ WeRU.B (Orchestrator)
   ├─ Intent 분석
   ├─ 워크플로우 선택 (e.g., "code_generation")
   └─ SSE 스트리밍으로 진행상황 전송

4️⃣ Proxy (WebSocket 브리지)
   SSE → WebSocket 변환
   웹 클라이언트에 실시간 전송

5️⃣ 웹 Dashboard
   실시간으로 진행상황 표시
   ├─ 진행도 바
   ├─ 로그 스트리밍
   └─ 최종 결과 표시
```

---

## 3. Web Client 설계 (Next.js)

### 3.1 페이지 구조

```
pages/
├─ /dashboard              # 실시간 모니터링
│  ├─ 진행 상황 (Progress)
│  ├─ 실행 이력 (History)
│  └─ 통계 (Stats)
│
├─ /orchestrate            # 대화형 인터페이스
│  ├─ Chat 입력
│  ├─ 메시지 히스토리
│  ├─ 🆕 Embedded Terminal
│  └─ 결과 표시
│
├─ /projects              # 프로젝트 관리
│  ├─ 프로젝트 목록
│  ├─ 상세 정보
│  └─ 결과 조회
│
└─ /analytics             # 분석 대시보드
   ├─ RAG 통계
   ├─ 의도 분석
   └─ 성능 메트릭
```

### 3.2 API 클라이언트

```typescript
// lib/api/orchestrator.ts

interface ApiClient {
  // Orchestrator Chat (자연어 입력)
  orchestrateChat(input: string): AsyncGenerator<OrchestrateEvent>;
  
  // 실행 상태 조회
  getExecutionStatus(runId: string): Promise<ExecutionStatus>;
  
  // 이력 조회
  getHistory(limit: number): Promise<Execution[]>;
  
  // RAG 검색
  ragSearch(query: string): Promise<SearchResult[]>;
}

// 사용 예
const client = createApiClient('https://localhost:8000');

// 실시간 스트리밍
for await (const event of client.orchestrateChat('FastAPI 만들어줘')) {
  console.log(event);
  // { type: 'log', data: '...' }
  // { type: 'phase_completed', ... }
  // { type: 'completed', result: {...} }
}
```

### 3.3 State Management (Zustand)

```typescript
// 세션 상태
useSessionStore = {
  sessionId: string
  currentInput: string
  inputHistory: string[]
  
  setInput: (input) => void
  addToHistory: (input) => void
}

// 실행 상태
useExecutionStore = {
  isRunning: boolean
  currentEvent: OrchestrateEvent
  events: OrchestrateEvent[]
  
  addEvent: (event) => void
  reset: () => void
}

// RAG 상태
useRagStore = {
  searchResults: SearchResult[]
  searchQuery: string
  
  search: (query) => Promise<void>
}
```

---

## 4. Proxy Layer 설계 (FastAPI 최소화)

### 4.1 주요 역할

```python
# app/main.py
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ============================================================
# 1️⃣ API 라우팅 (REST)
# ============================================================

@app.post("/api/orchestrate")
async def orchestrate(request: OrchestrateRequest):
    """
    사용자 입력을 받아 WeRU.B Server로 전달
    
    요청:
      { "input": "FastAPI 만들어줘" }
    
    응답:
      { "session_id": "orch-xxx", "status": "started" }
    """
    
    # 1. 세션 생성/관리
    session = get_or_create_session(request.session_id)
    
    # 2. WeRU.B Server로 전달
    run_id = await weru_client.orchestrator_chat(
        message=request.input,
        session_id=session.id
    )
    
    return {
        "session_id": session.id,
        "run_id": run_id,
        "status": "started"
    }

# ============================================================
# 2️⃣ WebSocket (실시간 스트리밍)
# ============================================================

@app.websocket("/ws/orchestrate/{session_id}")
async def websocket_orchestrate(websocket: WebSocket, session_id: str):
    """
    WeRU.B Server의 SSE 스트림을 WebSocket으로 변환
    """
    
    await websocket.accept()
    
    try:
        # WeRU.B Server SSE 스트림 구독
        async with weru_client.orchestrator_stream(session_id) as stream:
            async for event in stream:
                # SSE → WebSocket 변환
                await websocket.send_json({
                    "type": event.type,
                    "data": event.data,
                    "timestamp": event.timestamp
                })
    
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "error": str(e)
        })
    finally:
        await websocket.close()

# ============================================================
# 3️⃣ RAG 검색
# ============================================================

@app.post("/api/rag/search")
async def rag_search(query: str):
    """
    WeRU.B RAG 검색 (벡터 기반)
    """
    
    results = await weru_client.rag_search(
        query=query,
        limit=5
    )
    
    return {"results": results}

# ============================================================
# 4️⃣ 세션 관리
# ============================================================

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """세션 정보 조회"""
    session = get_session(session_id)
    return session

@app.get("/api/history/{session_id}")
async def get_history(session_id: str):
    """실행 이력 조회"""
    history = await redis_client.get_history(session_id)
    return {"history": history}
```

### 4.2 WeRU.B Client 래퍼

```python
# app/clients/weru_client.py

class WeRUClient:
    """WeRU.B Server 클라이언트"""
    
    BASE_URL = "https://weve.io.kr/ollama"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = aiohttp.ClientSession()
    
    async def orchestrator_chat(self, message: str, session_id: str):
        """
        /api/orchestrator/chat 호출
        
        WeRU.B가 자동으로:
        1. 메시지 분석
        2. 워크플로우 선택
        3. SSE로 스트림 시작
        """
        
        response = await self.session.post(
            f"{self.BASE_URL}/api/orchestrator/chat",
            json={"message": message},
            headers=self._auth_headers()
        )
        
        data = await response.json()
        return data["run_id"]
    
    async def orchestrator_stream(self, session_id: str):
        """
        SSE 스트림 구독
        
        이벤트들:
        - phase_started
        - phase_progress (로그)
        - phase_completed
        - orchestration_completed
        """
        
        response = await self.session.get(
            f"{self.BASE_URL}/api/orchestrator/status/{session_id}",
            headers=self._auth_headers(),
            timeout=aiohttp.ClientTimeout(total=None)
        )
        
        async for line in response.content:
            if line.startswith(b"data:"):
                event = json.loads(line[5:])
                yield event
    
    async def rag_search(self, query: str, limit: int = 5):
        """RAG 벡터 검색"""
        
        response = await self.session.post(
            f"{self.BASE_URL}/api/rag/search",
            json={
                "query": query,
                "limit": limit
            },
            headers=self._auth_headers()
        )
        
        return await response.json()
    
    def _auth_headers(self):
        """인증 헤더"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
```

---

## 5. Embedded CLI 통합

### 5.1 WebSocket 기반 CLI 실행

```typescript
// components/EmbeddedTerminal.tsx

interface TerminalProps {
  sessionId: string;
  onCommand?: (cmd: string) => void;
}

export default function EmbeddedTerminal({ sessionId, onCommand }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal] = useState(() => new Terminal());
  
  useEffect(() => {
    // Terminal 초기화
    terminal.open(terminalRef.current!);
    
    // WebSocket 연결
    const ws = new WebSocket(
      `wss://localhost:8000/ws/cli/${sessionId}`,
      ['terminal']
    );
    
    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      
      if (type === 'log') {
        terminal.write(data + '\r\n');
      } else if (type === 'completed') {
        terminal.write('\r\n✓ Command completed\r\n');
      }
    };
    
    return () => {
      ws.close();
      terminal.dispose();
    };
  }, [sessionId]);
  
  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>CLI Terminal</DialogTitle>
        </DialogHeader>
        <div ref={terminalRef} className="h-64 bg-black rounded" />
      </DialogContent>
    </Dialog>
  );
}
```

### 5.2 Proxy에서 CLI 실행

```python
# app/routes/cli.py

@app.post("/api/cli/execute")
async def execute_cli_command(request: CLIExecuteRequest):
    """
    CLI 명령 실행
    
    예시:
    POST /api/cli/execute
    {
      "command": "validate --data '{...}'",
      "session_id": "orch-xxx"
    }
    """
    
    cli_session_id = create_cli_session()
    
    # 백그라운드에서 CLI 실행
    asyncio.create_task(
        run_cli_process(
            cli_session_id,
            request.command,
            request.session_id
        )
    )
    
    return {"cli_session_id": cli_session_id, "status": "started"}

async def run_cli_process(cli_session_id: str, command: str, orch_session_id: str):
    """CLI 프로세스 실행"""
    
    # Python 서브프로세스 실행
    process = await asyncio.create_subprocess_shell(
        f"python -m cli {command}",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    # 로그 스트리밍
    while True:
        line = await process.stdout.readline()
        if not line:
            break
        
        # WebSocket 클라이언트에 전송
        await broadcast_cli_event(cli_session_id, {
            "type": "log",
            "data": line.decode().strip()
        })
    
    # 완료
    await broadcast_cli_event(cli_session_id, {
        "type": "completed",
        "return_code": await process.wait()
    })

@app.websocket("/ws/cli/{cli_session_id}")
async def websocket_cli(websocket: WebSocket, cli_session_id: str):
    """CLI 로그 스트리밍"""
    
    await websocket.accept()
    
    try:
        while True:
            # CLI 세션 확인
            cli_session = get_cli_session(cli_session_id)
            if cli_session.status == "completed":
                break
            
            await asyncio.sleep(0.1)
    finally:
        await websocket.close()
```

---

## 6. API 통합 가이드

### 6.1 주요 WeRU.B API 매핑

```
우리의 API                    ↓ 매핑 ↓         WeRU.B API

POST /api/orchestrate      →  POST /orchestrator/chat
                               └─ 자연어 → 워크플로우 자동

WS /ws/orchestrate/{id}    →  SSE /orchestrator/status/{run_id}
                               └─ 진행상황 실시간 스트리밍

POST /api/rag/search       →  POST /rag/search
                               └─ 벡터 검색

POST /api/queue/submit     →  POST /queue/submit
                               └─ 대량 작업 제출

GET /api/history           →  GET /orchestrator/history
                               └─ 실행 이력 조회
```

### 6.2 인증

```python
# 모든 요청에 API Key 포함

headers = {
    "Authorization": f"Bearer {WERU_API_KEY}",
    "Content-Type": "application/json"
}

# 우리의 Proxy는 토큰을 관리하고
# 웹 클라이언트는 세션 ID만 사용
```

### 6.3 에러 처리

```python
# WeRU.B 에러 코드

401: API Key 인증 실패
429: 요청 한도 초과 (retry 로직)
503: LLM 서버 오류 (fallback)

# 우리의 Proxy에서 처리
- 자동 재시도 (exponential backoff)
- 사용자 친화적 에러 메시지
```

---

## 7. 배포 및 설정

### 7.1 Docker 구성 (최소화)

```yaml
# docker-compose.yml

version: '3.8'

services:
  # Web Frontend
  web:
    build:
      context: ./orchestrator_web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - api

  # Proxy Layer (FastAPI)
  api:
    build:
      context: ./orchestrator_api
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - WERU_API_KEY=${WERU_API_KEY}
      - WERU_BASE_URL=https://weve.io.kr/ollama
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  # Session Storage
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # WeRU.B Server (외부)
  # → https://weve.io.kr/ollama
```

### 7.2 환경 변수

```bash
# .env

# WeRU.B Server
WERU_API_KEY=sk-xxxxxxxxxxxx
WERU_BASE_URL=https://weve.io.kr/ollama

# Proxy
REDIS_URL=redis://localhost:6379
PROXY_PORT=8000

# Web
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### 7.3 개발 vs 프로덕션

```
개발 (로컬)
├─ Next.js: http://localhost:3000
├─ Proxy: http://localhost:8000
├─ Redis: localhost:6379
└─ WeRU.B: https://weve.io.kr/ollama (실제 서버)

프로덕션
├─ Next.js: https://orchestrator.example.com
├─ Proxy: https://api.orchestrator.example.com
├─ Redis: (클라우드 서비스)
└─ WeRU.B: https://weve.io.kr/ollama (실제 서버)
```

---

## 최종 요약

### 구현 범위 (최소화)

✅ **Web Dashboard** (Next.js)
  - 사용자 인터페이스
  - 실시간 모니터링
  - Embedded Terminal

✅ **Proxy Layer** (FastAPI - 경량)
  - API 라우팅
  - 인증 관리
  - WebSocket 브리지
  - 세션 관리

✅ **CLI 통합**
  - 웹에서 터미널 실행
  - 명령 실행 및 로그 스트리밍

❌ **제외** (WeRU.B Server가 처리)
  - LLM 엔진
  - Intent Analysis
  - Orchestrator 로직
  - RAG 시스템
  - Queue 관리

### 기술 스택

| 계층 | 기술 |
|-----|------|
| **Frontend** | Next.js, React, Tailwind |
| **Backend** | FastAPI (경량 프록시) |
| **Real-time** | WebSocket, Redis |
| **Terminal** | xterm.js |
| **External** | WeRU.B Server |

### 구현 난이도

**매우 단순화됨** (Orchestrator 로직 불필요)

```
기존 설계 (8주):
├─ Phase 1-4: Core + LLM (4주)
├─ Phase 5-7: Web + Dashboard (3주)
└─ Phase 8: Testing (1주)

WeRU.B 기반 (4주):
├─ Phase 1: Web Dashboard (2주)
├─ Phase 2: Proxy Layer (1주)
└─ Phase 3: Testing (1주)
```

---

**설계서 버전**: 3.4 (WeRU.B Server Integration)  
**마지막 수정**: 2026-05-12  
**상태**: ✅ 설계 완료 - 최소화된 아키텍처
