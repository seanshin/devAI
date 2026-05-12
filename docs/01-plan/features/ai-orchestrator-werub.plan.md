# 기획서: AI 오케스트레이터 Web Dashboard (WeRU.B Server 기반)

**프로젝트명**: AI Orchestrator Web Dashboard - WeRU.B Server Integration  
**작성일**: 2026-05-12  
**프로젝트 규모**: Compact Web Service  
**기술 스택**: Next.js + FastAPI Proxy + WeRU.B Server  
**상태**: 설계 단계 (기존 서버 활용)  
**핵심**: WeRU.B의 Orchestrator API 활용 → 웹 대시보드 + Embedded CLI 제공

---

## 1. 프로젝트 개요

### 1.1 비전: WeRU.B 서버의 강력한 기능을 웹으로 제공

```
WeRU.B AI Server의 Orchestrator 기능
├─ 자연어 → 자동 워크플로우 실행
├─ 실시간 진행상황 모니터링
└─ 벡터 기반 RAG 검색

+ 우리의 Web Dashboard
├─ 깔끔한 사용자 인터페이스
├─ 실시간 대시보드
└─ 임베디드 CLI 터미널

= 완전한 웹 기반 오케스트레이션 플랫폼
```

### 1.2 핵심 특징 (최소화된 설계)

| 특징 | 설명 |
|------|------|
| **기존 서버 활용** | WeRU.B의 Orchestrator + LLM + RAG 그대로 사용 |
| **웹 인터페이스** | Next.js 기반 깔끔한 대시보드 |
| **Embedded Terminal** | 웹 내 CLI 실행 환경 (xterm.js) |
| **경량 Proxy** | FastAPI 경량 프록시로 API 라우팅 |
| **실시간 모니터링** | WebSocket으로 진행상황 실시간 표시 |
| **세션 관리** | Redis 기반 세션 저장 |
| **RAG 통합** | WeRU.B의 벡터 검색 활용 |
| **빠른 배포** | 최소 의존성, 단순한 아키텍처 |

### 1.3 사용 시나리오

```
시나리오: 웹 브라우저에서 프로젝트 개발

1️⃣ 웹 대시보드 열기
   https://orchestrator.example.com
   
2️⃣ 채팅 입력
   "FastAPI 기반 사용자 인증 시스템 만들어줘"
   
3️⃣ 자동 실행
   ✅ Intent 분석 (WeRU.B)
   ✅ 워크플로우 선택 (Orchestrator)
   ✅ 코드 생성 (LLM)
   ✅ 결과 검증 (가능시)
   
4️⃣ 결과 모니터링
   Dashboard에서 실시간 진행상황 보기
   ├─ Phase Progress
   ├─ Log Streaming
   ├─ Generated Files
   └─ Final Output

5️⃣ 결과 다운로드
   생성된 코드, 문서 등 다운로드
```

---

## 2. 아키텍처

### 2.1 시스템 구조

```
┌────────────────────────────────────────────────────┐
│         Web Browser                                │
│  https://orchestrator.example.com                  │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ Dashboard    │  │ Chat Input   │              │
│  │ (모니터링)   │  │ (입력)       │              │
│  └──────────────┘  └──────────────┘              │
│         ↓                 ↓                        │
│  ┌────────────────────────────────────────────┐  │
│  │  Next.js Frontend                          │  │
│  │  - State Management (Zustand)              │  │
│  │  - Real-time Updates (WebSocket)           │  │
│  │  - Embedded Terminal (xterm.js)            │  │
│  └────────┬─────────────────────────────────┘   │
└───────────┼──────────────────────────────────────┘
            │ REST + WebSocket
            ↓
┌────────────────────────────────────────────────────┐
│  Proxy Layer (FastAPI)                            │
│  https://api.orchestrator.example.com              │
│  ┌────────────────────────────────────────────┐   │
│  │ - API 라우팅                              │   │
│  │ - 인증 (Bearer token)                     │   │
│  │ - WebSocket Bridge (SSE ↔ WS)           │   │
│  │ - 세션 관리                               │   │
│  │ - CLI 실행                                │   │
│  └────────┬───────────────────────────────────┘   │
└───────────┼──────────────────────────────────────┘
            │ HTTPS
            ↓
╔════════════════════════════════════════════════════╗
║    WeRU.B AI Server (v2.33.0)                     ║
║    https://weve.io.kr/ollama                      ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  📡 Orchestrator API (7개)                        ║
║    ├─ POST /api/orchestrator/chat ⭐             ║
║    │  (자연어 → 워크플로우 자동 선택)            ║
║    ├─ POST /api/orchestrator/run/stream           ║
║    │  (SSE 스트리밍 진행상황)                     ║
║    ├─ GET /api/orchestrator/status/{run_id}      ║
║    ├─ GET /api/orchestrator/workflows             ║
║    └─ GET /api/orchestrator/history               ║
║                                                    ║
║  🧠 LLM Engines (8개)                             ║
║    ├─ qwen2.5:14b (기본, 한국어 99%)             ║
║    ├─ qwen2.5-coder:14b (코딩)                   ║
║    ├─ deepseek-coder-v2:16b (빠른 코딩)         ║
║    └─ medllama2, meditron (의료)                 ║
║                                                    ║
║  📊 Queue System (16 API)                         ║
║    └─ 대량 작업 제출 & 모니터링                  ║
║                                                    ║
║  🔍 RAG System (5 API)                            ║
║    ├─ /api/rag/search (벡터 검색)               ║
║    ├─ /api/rag/ask (RAG QA)                      ║
║    └─ 8개 워크플로우 지원                        ║
║                                                    ║
║  💾 Storage                                       ║
║    ├─ ChromaDB (Vector DB)                       ║
║    ├─ SQLite WAL (고성능)                        ║
║    └─ GPU: RTX 5080 16GB                         ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

### 2.2 우리가 구현할 것 vs WeRU.B가 제공하는 것

```
우리 구현 (Web Layer):
✅ Next.js 대시보드
✅ FastAPI 경량 프록시
✅ WebSocket 브리지
✅ 세션 관리 (Redis)
✅ Embedded Terminal UI
└─ 총 ~2K lines of code (매우 간단)

WeRU.B가 제공 (Backend):
✅ Orchestrator (자동 워크플로우)
✅ LLM 엔진 (8개 모델)
✅ Intent Analysis
✅ RAG System
✅ Queue System
✅ GPU 인프라 (RTX 5080)
└─ 총 ~255 API
```

---

## 3. 요구사항 정의

### 3.1 기능 요구사항

#### FR-1: Web Dashboard
- [ ] 실시간 진행상황 모니터링
- [ ] 워크플로우 실행 이력 조회
- [ ] 결과물 다운로드
- [ ] RAG 기반 분석 결과 표시

#### FR-2: Chat Interface
- [ ] 자연어 입력
- [ ] 실시간 응답 스트리밍
- [ ] 대화 히스토리 저장
- [ ] 멀티턴 대화 지원

#### FR-3: Embedded Terminal
- [ ] 웹 내 CLI 실행 환경
- [ ] 명령 실행 및 로그 스트리밍
- [ ] 결과 실시간 표시

#### FR-4: Session Management
- [ ] 사용자 세션 관리
- [ ] 프로젝트별 격리
- [ ] 세션 저장/복원

#### FR-5: API Integration
- [ ] WeRU.B Orchestrator API 호출
- [ ] RAG 검색 통합
- [ ] Queue 작업 모니터링

### 3.2 비기능 요구사항

| 요구사항 | 목표 |
|---------|------|
| **응답시간** | <2초 |
| **동시 사용자** | 10+ |
| **가용성** | 99% |
| **배포 시간** | <10분 |

---

## 4. 기술 스택

### 4.1 Frontend

```
Framework: Next.js 14+
  ├─ React
  ├─ TypeScript
  └─ App Router

Styling:
  ├─ Tailwind CSS
  └─ shadcn/ui

State:
  └─ Zustand

Real-time:
  └─ WebSocket (Socket.io)

Terminal:
  └─ xterm.js

Testing:
  ├─ Vitest
  └─ React Testing Library
```

### 4.2 Backend (Minimal)

```
Framework: FastAPI
  ├─ Pydantic
  └─ asyncio

Session:
  └─ Redis

HTTP Client:
  └─ aiohttp

Testing:
  ├─ pytest
  └─ pytest-asyncio
```

### 4.3 External Service

```
WeRU.B AI Server:
  ├─ Orchestrator API
  ├─ LLM (qwen2.5:14b)
  ├─ RAG System
  └─ Queue System
```

---

## 5. 개발 로드맵

### 5.1 Phase 1: Web Dashboard (1주)

**목표**: 기본 Web UI 완성

- [ ] Next.js 프로젝트 구성
- [ ] Layout & 기본 페이지 구조
- [ ] Zustand 상태 관리
- [ ] Dashboard 페이지 UI
- [ ] Chat 입력 UI
- [ ] 스타일링 (Tailwind)

**산출물**: 기본 웹 인터페이스 (로직 없음)

### 5.2 Phase 2: API 통합 (1주)

**목표**: WeRU.B Server API 연동

- [ ] FastAPI 프록시 구성
- [ ] 인증 처리 (Bearer token)
- [ ] /api/orchestrator/chat 연동
- [ ] 세션 관리 (Redis)
- [ ] 에러 처리

**산출물**: 웹에서 WeRU.B API 호출 가능

### 5.3 Phase 3: Real-time Streaming (3일)

**목표**: 실시간 모니터링

- [ ] WebSocket 구현
- [ ] SSE → WebSocket 변환
- [ ] 진행상황 실시간 표시
- [ ] 로그 스트리밍

**산출물**: 실시간 대시보드 완성

### 5.4 Phase 4: Embedded Terminal (3일)

**목표**: 웹 내 CLI 환경

- [ ] xterm.js 통합
- [ ] Terminal 컴포넌트
- [ ] CLI 명령 실행
- [ ] 로그 스트리밍

**산출물**: Embedded Terminal 완성

### 5.5 Phase 5: 추가 기능 (3일)

**목표**: 고급 기능 추가

- [ ] 결과 다운로드
- [ ] 이력 조회
- [ ] RAG 검색
- [ ] 프로젝트 관리

**산출물**: 완전한 웹 대시보드

### 5.6 Phase 6: Testing & Deploy (2일)

**목표**: 배포 준비

- [ ] 유닛 테스트
- [ ] E2E 테스트
- [ ] Docker 컨테이너화
- [ ] 배포 가이드

**산출물**: 프로덕션 배포 준비

---

## 6. 마일스톤

| 마일스톤 | 목표 | 타이밍 |
|---------|------|--------|
| **M1** | Web UI 기본 구조 | 1주 |
| **M2** | WeRU.B API 연동 | 2주 |
| **M3** | 실시간 모니터링 | 2.5주 |
| **M4** | Embedded Terminal | 3주 |
| **M5** | 추가 기능 완성 | 3.5주 |
| **M6** | 배포 준비 | 4주 |

---

## 7. 비용 구조

### 7.1 개발 비용 (일회)

| 항목 | 비용 |
|------|------|
| 1 Senior FE Engineer (4주) | $8K |
| 1 Junior Backend Engineer (2주) | $2K |
| **총 개발 비용** | **$10K** |

### 7.2 운영 비용 (월)

| 항목 | 비용 | 설명 |
|------|------|------|
| WeRU.B API | $0-100 | 기존 서버 활용 |
| Web Server | $50-100 | Vercel 또는 자체 호스팅 |
| Redis | $10-20 | 클라우드 서비스 |
| **월 합계** | **$60-220** | |

---

## 8. 팀 구성

| 역할 | 인원 | 책임 |
|------|------|------|
| Senior Frontend Engineer | 1 | Next.js, UI/UX, 통합 |
| Junior Backend Engineer | 1 | FastAPI, API 라우팅 |

---

## 최종 요약

### 핵심

✅ **WeRU.B Server 완전 활용**  
✅ **Web Dashboard 구현**  
✅ **Embedded Terminal 제공**  
✅ **최소 개발 비용 ($10K)**  
✅ **4주 빠른 배포**  
✅ **기존 LLM/RAG 그대로 사용**

### 차별점

- **최소화된 설계**: 불필요한 로직 구현 안 함
- **빠른 배포**: 4주만에 완성
- **경제적**: 기존 서버 활용으로 비용 최소화
- **깔끔한 UI**: 사용자 친화적 대시보드
- **확장 가능**: WeRU.B의 모든 API 활용 가능

### 다음 단계

1. ✅ 설계 완료
2. → Do Phase 시작 (구현)
3. → 4주 내 배포

---

**Plan 문서 버전**: 3.4 (WeRU.B Integration)  
**마지막 수정**: 2026-05-12  
**상태**: ✅ 설계 완료, 구현 준비 완료
