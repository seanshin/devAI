# 기획서: AI 오케스트레이터 CLI v3 (멀티-에이전트 자동 분류 & 실행)

**프로젝트명**: Intelligent AI Orchestrator - Server + Web Client + Dashboard System  
**작성일**: 2026-05-12 (웹 기반 버전)  
**프로젝트 규모**: Enterprise Web Service  
**기술 스택**: Python Server + Next.js Client + WebSocket + Ollama + Claude API  
**상태**: Architecture Design Phase (웹 기반 확장)  
**핵심**: CLI/웹 두 가지 인터페이스 → 자동 분류 → 에이전트 자동 분배 → 실시간 대시보드

---

## 1. 프로젝트 개요

### 1.1 비전: CLI로 복잡한 소프트웨어 개발 자동화

```
사용자 입력:
$ ai-orchestrator "REST API 프로젝트를 FastAPI로 만들어줘"

자동 진행:
  1️⃣  자동 분류: "프로젝트 개발" 감지
  2️⃣  질문 단계: Ollama가 요구사항 파악 (database? auth? 등)
  3️⃣  기획 단계: Ollama가 기획서 작성
  4️⃣  개발 단계: Ollama가 코드 생성
  5️⃣  검증 단계: Claude가 마스킹 데이터 검증
  6️⃣  내부 저장: 검증 피드백을 RAG에 저장
  7️⃣  완료: 사용자에게 결과 제시

결과물: 프로젝트 폴더, 기획서, 코드, README 모두 생성됨
```

### 1.2 핵심 특징 (멀티 채널 지능형 자동화)

| 특징 | 설명 |
|------|------|
| **대화형 인터페이스** | CLI + **웹 클라이언트** 두 가지 인터페이스 제공 |
| **실시간 대시보드** | 🆕 **WebSocket 기반 실시간 진행상황 모니터링** |
| **영리한 의도 파악** | 자연어 깊이 있게 분석, 사용자 의도 정확히 파악 |
| **스마트 멀티-턴 대화** | 필요한 정보 자동 식별 & 영리한 질문 생성 |
| **자동 시스템 구성** | GitHub, DB, 서버 연결 모두 자동화 |
| **Telnet/SSH 자동 연결** | 원격 서버 자동 접속 & 설정 |
| **문맥 기반 학습** | 이전 대화 기억 & 프로젝트별 상태 유지 |
| **동적 단계 라우팅** | 대화 흐름에 따라 실행 단계 자동 결정 |
| **멀티-에이전트 오케스트레이션** | 각 단계별 최적 에이전트 자동 분배 |
| **LLM 추상화** | Ollama (로컬), Claude (검증), 확장 가능 |
| **Zero Trust 보안** | 기밀 정보 마스킹, 내부 저장만 유지 |
| **RAG 통합** | 지속적 학습, 과거 사례 활용, 개선 |
| **세션 관리** | 웹과 CLI 간 세션 공유 가능 |
| **프로젝트 격리** | 각 프로젝트별 독립적인 컨텍스트 관리 |

### 1.3 사용 시나리오 (영리한 대화형)

**시나리오 1: 웹 대시보드에서 새 프로젝트 자동 구성 (대화형 자동화)**
```
🌐 웹 브라우저: https://orchestrator.example.com

🤖 오케스트레이터가 영리하게 분석:
  ✅ 의도 파악: "프로젝트 전체 구성" 필요
  ✅ 필수 정보 부족 감지 (GitHub? 서버? DB? 등)

💬 Multi-turn 대화로 정보 수집:
Q1) GitHub 저장소는? (새로 만들기/기존 사용)
👤 "새로 만들어줘"

Q2) 데이터베이스는? (PostgreSQL/MySQL/MongoDB)
👤 "PostgreSQL로"

Q3) 서버 환경? (로컬/AWS/GCP/Azure)
👤 "AWS EC2 예정"

Q4) 규모? (소규모/중규모/대규모)
👤 "중규모, 100만 사용자"

Q5) 보안? (GDPR/SOC2/기본)
👤 "GDPR 준수"

[자동 단계 결정 & 실행 시작]

📋 기획 단계 (Ollama):
  ✅ 아키텍처 설계
  ✅ DB 스키마
  ✅ API 설계
  📄 기획서 생성

✅ GitHub 자동 설정 (실행):
  🔑 GitHub Token 입력 요청
  👤 입력: (GitHub token 입력)
  
  ✅ Repository 자동 생성: user-auth-system
  ✅ .gitignore 생성
  ✅ README.md 생성
  ✅ Initial commit
  ✅ 로컬 Git 연결

✅ 데이터베이스 자동 구성 (실행):
  🔑 PostgreSQL 연결정보 입력 요청
  👤 입력: host=localhost, user=postgres, password=***
  
  ✅ 데이터베이스 생성: user_auth_system
  ✅ 마이그레이션 스크립트 생성
  ✅ 초기 스키마 생성 (users, tokens 테이블)
  ✅ 연결 테스트 성공

✅ 서버 자동 설정 (실행):
  🔑 AWS 접속 정보 입력 요청
  👤 입력: EC2 IP, SSH key path
  
  ✅ SSH/Telnet으로 서버 접속
  ✅ Python 3.11 설치 확인
  ✅ requirements.txt 생성
  ✅ 의존성 자동 설치
  ✅ 환경 변수 파일 생성 (.env)
  ✅ 서버 구성 완료

📝 코드 개발 단계 (Ollama):
  ✅ main.py (FastAPI 기본 구조)
  ✅ models.py (DB 모델)
  ✅ schemas.py (Pydantic 스키마)
  ✅ routers/auth.py (인증 API)
  ✅ routers/users.py (사용자 API)
  ✅ tests/ (테스트 코드)
  ✅ requirements.txt

🔍 검증 단계 (Embedded Terminal + Claude):
  [Embedded Terminal 자동 오픈]
  $ orchestrator validate --session orch-xxx
  ✅ 보안 검증 (GDPR 준수 확인)
  ✅ 확장성 검증 (100만 사용자)
  ✅ 성능 검증
  ✅ 코드 품질 검증
  [완료 후 자동 닫힘]

🚀 자동 배포 단계 (실행):
  ✅ 모든 파일 서버로 전송 (SFTP)
  ✅ 데이터베이스 마이그레이션 실행
  ✅ 환경 변수 설정
  ✅ Uvicorn 프로세스 시작
  ✅ Health check (API 응답 확인)
  ✅ 배포 성공!

📚 RAG 저장 (내부):
  💾 전체 대화 기록 저장
  💾 프로젝트 메타데이터 저장
  💾 구성 결정사항 저장
  💾 검증 피드백 저장

완료! 🎉
✅ GitHub Repository: https://github.com/your-org/user-auth-system
✅ 서버 접속: ssh -i key.pem ec2-user@xxx.xxx.xxx.xxx
✅ API 테스트: curl http://xxx.xxx.xxx.xxx:8000/docs
✅ DB 연결: postgresql://postgres@localhost/user_auth_system

다음 단계 제안:
  → 프론트엔드 개발?
  → 추가 API 개발?
  → 배포 자동화?
  → 모니터링 설정?
```

**시나리오 2: 기존 코드 검증 (컨텍스트 기반)**
```bash
$ ai-orchestrator "이 코드 검증해줄 수 있어?"

🤖 오케스트레이터가 현재 프로젝트 분석:
  ✅ 현재 디렉토리에서 프로젝트 감지
  ✅ 파일 구조 파악: FastAPI 프로젝트 (40개 파일, 3,000줄)
  ✅ 기술 스택 분석: Python, FastAPI, PostgreSQL, JWT

대화:
Q1) 어느 부분을 중점적으로? (보안/성능/테스트/아키텍처)
👤 "보안과 성능"

Q2) 특별히 확인할 부분이 있어? (데이터베이스/인증/API)
👤 "API와 DB 쿼리"

[영리하게 검증 전략 수립]

분석 단계: Ollama가 코드 분석
  ✅ N+1 쿼리 패턴 찾기
  ✅ 인증 로직 검토
  ✅ 입력 검증 확인

검증 단계: Claude가 상세 검증
  ✅ SQL injection 취약점 스캔
  ✅ JWT 구현 안전성
  ✅ 에러 처리 완전성

피드백 생성:
  ⚠️  발견된 문제 3개
  ✅ 개선 제안 5개
  📊 심각도별 분류

RAG 저장:
  💾 "FastAPI JWT API 검증" 사례로 저장
  🔍 유사한 과거 사례 2개 검색

완료!
✅ 검증 보고서: ./validation_report.md
```

**시나리오 3: 기능 개발 (자동 단계화)**
```bash
$ ai-orchestrator "사용자 프로필 API 추가해줄 수 있어?"

🤖 오케스트레이터가 현재 상태 파악:
  ✅ 프로젝트: auth-system (FastAPI)
  ✅ 현재 상태: Users API 완료, Auth 완료
  ✅ 다음 단계: Users Profile API 개발 필요

대화:
Q1) 어떤 필드 포함? (프로필 사진/자기소개/소셜 링크)
👤 "프로필 사진, 자기소개, 최신 로그인"

Q2) 테스트 포함할 거야?
👤 "당연하지"

Q3) 기존 코드 스타일 유지?
👤 "그래"

[자동으로 개발 계획 수립]

설계 단계: Ollama가 설계
  ✅ DB 마이그레이션 작성
  ✅ API 엔드포인트 설계
  ✅ 테스트 케이스 설계

개발 단계: Ollama가 코드 생성
  ✅ models.py (프로필 모델)
  ✅ routers/profile.py (API)
  ✅ tests/test_profile.py (테스트)

검증 단계: Claude가 검증
  ✅ 보안: 파일 업로드 검증 확인
  ✅ 성능: DB 쿼리 최적화
  ✅ 일관성: 기존 코드 스타일 준수

커밋 단계: 자동 Git 커밋
  ✅ "feat: add user profile API"
  ✅ 기능별 커밋 자동 분할

RAG 저장:
  💾 "프로필 API 개발" 사례 저장
  💾 검증 피드백 저장

완료!
✅ 코드: ./app/routers/profile.py
✅ 마이그레이션: ./migrations/...
✅ 테스트: ./tests/test_profile.py
```

---

## 2. 아키텍처

### 2.1 멀티 채널 아키텍처 (CLI + 웹)

```
┌─────────────────────────────────────────────────────────────┐
│   User Input (CLI 또는 Web)                               │
│   🖥️  CLI: $ ai-orchestrator "사용자 인증 시스템..."    │
│   🌐 Web: Browser → https://orchestrator.example.com     │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│   API Gateway (FastAPI)                                  │
│   ├─ REST API (/api/intent, /api/questions, /api/execute)│
│   ├─ WebSocket (/ws/session/{session_id})               │
│   └─ 인증 & 세션 관리                                   │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌───────────────────────────────────────────────────────────┐
│   Orchestrator Core (기존 로직)                         │
│   ├─ Intent Analyzer, Question Generator, Phase Router  │
│   ├─ Multi-Agent Executor, Data Masking, RAG           │
│   └─ Session & Context Manager                         │
└────────────────┬────────────────────────────────────────────┘
                 ↓
        ┌────────┴────────┐
        ↓                 ↓
   🖥️ CLI Output     🌐 WebSocket Event Stream
   (REPL)           → Dashboard Real-time Update
```

### 2.1a 웹 클라이언트 아키텍처 (Next.js + Embedded Terminal)

```
┌─────────────────────────────────────────────────────────────┐
│   Web Client (Next.js Frontend)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Pages:                                                    │
│   ├─ /dashboard        # 실시간 모니터링 & 이력             │
│   ├─ /orchestrate      # 대화형 인터페이스                 │
│   ├─ /projects         # 프로젝트 관리                     │
│   ├─ /settings         # 설정 & 에이전트 관리              │
│   └─ /analytics        # RAG 통계 & 분석                  │
│                                                              │
│   Real-time Features:                                       │
│   ├─ WebSocket Connection (Socket.io)                     │
│   ├─ Live Progress Bar & Streaming Output               │
│   ├─ Phase-by-phase Results Display                     │
│   └─ 🆕 Embedded Terminal (xterm.js)                     │
│                                                              │
│   Embedded Terminal (Claude API 필요시):                    │
│   ├─ xterm.js 기반 터미널 UI                             │
│   ├─ CLI 명령 자동 실행                                   │
│   ├─ 실시간 로그 스트리밍                                  │
│   └─ 완료 후 자동 닫힘                                     │
│       $ orchestrator validate --session xxx                │
│       ✓ Security check passed                             │
│       ✓ Code quality: Good                                │
│                                                              │
│   State Management (Zustand):                              │
│   ├─ Session Store (user, project, auth)               │
│   ├─ Orchestration Store (current execution)           │
│   ├─ Results Store (completed results, history)        │
│   └─ UI Store (modal, sidebar, theme)                  │
│                                                              │
│   API Client:                                               │
│   ├─ REST API 호출 (queries, mutations)                  │
│   ├─ WebSocket Events 구독 (실시간)                     │
│   ├─ 🆕 CLI Execute API (/api/cli/execute)              │
│   ├─ 🆕 CLI Streaming WebSocket (/ws/cli/{id})          │
│   └─ Automatic Reconnection                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 기존 영리한 대화형 CLI 플로우

```
┌─────────────────────────────────────────────────────────┐
│   User Input                                            │
│   $ ai-orchestrator "사용자 인증 시스템 만들어줘"      │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│   🧠 Smart Intent Analyzer (영리한 의도 분석)          │
│   - 사용자 입력의 깊이 있는 분석                         │
│   - 정확히 무엇을 원하는지 파악                          │
│   - 필수 정보 & 선택 정보 식별                          │
│   - 현재 프로젝트 상태 분석                              │
│   - 관련 과거 사례 검색 (RAG)                           │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│   💬 Smart Question Generator (영리한 질문 생성)        │
│   - 부족한 정보를 자동으로 파악                          │
│   - 영리한 질문으로 필수 정보 수집                       │
│   - 기술 레벨 맞춰 질문 조정                             │
│   - 과거 선택지 제시 (학습된 패턴)                      │
│   - Multi-turn 대화 시작                                │
│                                                          │
│   예) "Python/Node.js/Java 중 선호?"                   │
│       "JWT/OAuth/세션 중 어떤 방식?"                   │
│       "단위: 소규모/중규모/대규모?"                     │
│       "보안요구: GDPR/SOC2/기본?"                      │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│   🎯 Smart Context Builder (영리한 문맥 구성)           │
│   - 대화 기록 축적 (세션 메모리)                        │
│   - 사용자 선택 기억                                     │
│   - 프로젝트 상태 통합                                   │
│   - 관련 RAG 정보 주입                                  │
│   - 에이전트 프롬프트 최적화                             │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│   🔄 Dynamic Phase Router (동적 단계 라우팅)            │
│   - 대화 내용 분석 → 필요 단계 결정                      │
│   - 선형이 아닌 동적 흐름 (context dependent)          │
│   - 자동 단계 진행 (사용자 확인 최소화)                 │
│   - 단계별 최적 에이전트 선택                            │
│                                                          │
│   예) 기획 필요 → Planning Agent 호출                   │
│       개발 필요 → Development Agent 호출                 │
│       검증 필요 → Claude Validation 호출                │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│   🤖 Multi-Agent Execution (멀티-에이전트 실행)         │
│   - 최적 에이전트로 작업 실행                            │
│   - 스트리밍 출력 (실시간 피드백)                        │
│   - 병렬 처리 가능 (필요시)                              │
│   - 에러 처리 & 재시도                                   │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│   🔐 Secure Data Processing (보안 처리)                 │
│   - 기밀 정보 자동 감지                                  │
│   - 마스킹 (기밀은 내부만)                              │
│   - Claude 검증 (마스킹 데이터만)                      │
│   - 감시 로깅 (모든 외부 호출)                          │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│   📚 RAG Storage & Learning (RAG 저장 & 학습)          │
│   - 전체 대화 기록 저장                                  │
│   - 검증 피드백 저장                                     │
│   - 의사결정 패턴 학습                                   │
│   - 향후 유사 작업 개선                                  │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│   📤 Smart Output & Next Steps (영리한 결과 제시)       │
│   - 생성된 산출물 (코드, 문서, 설계)                    │
│   - 자동으로 다음 단계 제안                              │
│   - "계속할래?" 최소한의 확인                            │
│   - 자동 진행 또는 저장                                  │
│                                                          │
│   예) "기획서 생성 완료!"                               │
│       "다음: 개발 단계로 진행할까?"                     │
│       "[Y] 진행 [S] 저장 [Q] 종료"                    │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Smart Intent Understanding (영리한 의도 파악)

```
단순한 분류가 아닌 "깊이 있는 이해":

사용자 입력: "API 만들어줘"

기존 시스템: → "개발" 분류 → 코드 생성
문제: 필요 정보 부족 (어떤 API? DB? 보안?)

우리 시스템:
  💡 영리한 분석:
     - 기획 + 개발 + 검증 다단계 필요
     - 필수 정보 식별
     - 기술 수준 파악
     - 현재 프로젝트 상황 분석
     - RAG에서 유사 사례 검색
  
  💬 Multi-turn 대화로 진행:
     대화를 통해 정보 수집하며
     자동으로 단계 진행
  
  🎯 최종 결과:
     - API 설계 (기획)
     - 코드 생성 (개발)
     - 품질 검증 (검증)
     - 문서 생성 (문서화)
```

### 2.3 Multi-Agent System (자동화 포함)

```
┌────────────────────────────────────────────────────────┐
│   Intelligent Agent Pool                               │
├────────────────────────────────────────────────────────┤
│                                                         │
│   📋 Questioning Agent (질답)                          │
│   ├─ LLM: Ollama (빠름)                               │
│   └─ 역할: 명확한 답변 제공                           │
│                                                         │
│   📐 Planning Agent (기획)                            │
│   ├─ LLM: Ollama (초안) → Claude (검증)             │
│   └─ 역할: 기획서, 아키텍처 설계                      │
│                                                         │
│   💻 Development Agent (개발)                         │
│   ├─ LLM: Ollama (코드 생성)                         │
│   └─ 역할: 코드 작성, 테스트                          │
│                                                         │
│   ✅ Validation Agent (검증)                          │
│   ├─ LLM: Claude (검증 전문)                         │
│   └─ 역할: 품질 보증, 보안 체크                       │
│                                                         │
│   📝 Documentation Agent (문서)                       │
│   ├─ LLM: Ollama (작성) → Claude (검증)             │
│   └─ 역할: README, API Docs 생성                     │
│                                                         │
│   🔧 Infrastructure Agent (인프라) 🆕                 │
│   ├─ 역할: 서버, DB, 배포 자동화                      │
│   ├─ 기능:                                             │
│   │  ├─ SSH/Telnet 서버 자동 접속                    │
│   │  ├─ 패키지 설치 및 환경 설정                      │
│   │  ├─ PostgreSQL/MySQL DB 생성 & 마이그레이션     │
│   │  ├─ API 테스트 & Health check                     │
│   │  └─ 로그 수집 & 에러 분석                         │
│   └─ 실행: 자동화 스크립트 생성 & 실행               │
│                                                         │
│   🔗 GitHub Agent (GitHub 자동화) 🆕                  │
│   ├─ 역할: Repository 생성, 커밋, Push               │
│   ├─ 기능:                                             │
│   │  ├─ Repository 자동 생성                          │
│   │  ├─ .gitignore, README 생성                       │
│   │  ├─ Initial commit & Push                         │
│   │  ├─ Branch 관리                                    │
│   │  └─ PR/Issue 관리                                  │
│   └─ 실행: GitHub API 활용                            │
│                                                         │
│   🗄️ Database Agent (DB 자동화) 🆕                    │
│   ├─ 역할: DB 생성, 스키마 마이그레이션              │
│   ├─ 기능:                                             │
│   │  ├─ DB 생성 & 초기화                              │
│   │  ├─ 스키마 생성 (자동 마이그레이션)              │
│   │  ├─ Seed 데이터 삽입                              │
│   │  ├─ 연결 테스트                                    │
│   │  └─ 백업 설정                                      │
│   └─ 실행: SQL 스크립트 자동 생성 & 실행             │
│                                                         │
│   🚀 Deployment Agent (배포)                          │
│   ├─ LLM: Ollama (스크립트 생성)                     │
│   └─ 역할: Docker, 배포 자동화, CI/CD 구성          │
│                                                         │
│   🔄 Git Agent (Git 자동화)                           │
│   ├─ 역할: 커밋, 푸시, PR 생성                       │
│   └─ 권한: 내부만 (기밀 보호)                         │
│                                                         │
│   🧠 RAG Agent (학습 & 저장)                         │
│   ├─ 역할: 모든 대화, 설정, 검증 저장               │
│   └─ 활용: 유사 사례 검색, 개선, 패턴 학습          │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## 3. 요구사항 정의

### 3.1 기능 요구사항 (대화형 중심)

#### FR-1: Interactive Conversational CLI
```bash
# 단순히 명령만 입력, 대화로 진행
$ ai-orchestrator

🤖 오케스트레이터:
  "안녕하세요! 뭘 도와드릴까요?"

👤 사용자:
  "사용자 인증 시스템 만들어줄 수 있어?"

[자동으로 Multi-turn 대화 시작]
  Q1) "Python/Node.js/Java 중 선호?"
  Q2) "JWT/OAuth/세션?"
  Q3) "규모는?"
  Q4) "보안 요구사항?"

[자동으로 진행]
  ✅ 기획
  ✅ 개발
  ✅ 검증
  ✅ 저장

---

# 또는 구체적인 작업 직접 입력
$ ai-orchestrator "Users API 엔드포인트 추가해줘"

🤖 오케스트레이터:
  "현재 프로젝트 분석 중..."
  "필드 정의 필요: 어떤 필드 포함할까?"

👤 사용자:
  "username, email, created_at"

[대화 계속...]
```

#### FR-2: Smart Intent Analyzer (영리한 의도 분석)
- 자연어를 "깊이 있게" 분석 (단순 분류 아님)
- 사용자가 정말 원하는 게 무엇인지 파악
- 필수 정보 & 선택 정보 자동 식별
- 현재 프로젝트 상태 자동 분석
- RAG에서 유사한 과거 사례 검색
- 신뢰도 점수 + 부족 정보 목록 반환

#### FR-3: Smart Question Generator (영리한 질문 생성)
- 부족한 정보를 자동으로 파악
- 영리한 질문으로 필수 정보만 수집
- 기술 레벨에 맞춰 질문 조정
- 과거 선택지 제시 (learned patterns)
- Multi-turn 대화로 자연스럽게 진행
- 사용자 패턴 학습 (RAG 활용)

#### FR-4: Dynamic Phase Router (동적 단계 라우팅)
- 대화 내용 분석 → 필요 단계 자동 결정
- 선형이 아닌 동적 흐름 (context-dependent)
- "기획만 필요"/"개발까지 필요"/등 자동 판단
- 자동으로 다음 단계 진행 (사용자 확인 최소)
- 단계 간 context 자동 전달
- 사용자가 "중단" 언급하면 즉시 중단

#### FR-5: LLM Abstraction (추상화)
- Ollama, Claude, 다른 LLM 모두 지원
- 동일한 인터페이스로 호출
- LLM 스위칭 가능 (런타임)
- Fallback 메커니즘

#### FR-6: Data Masking & Security (보안)
- 자동 데이터 마스킹 (기밀 정보 제거)
- API Key, Token, 경로, 도메인 감지 & 제거
- 마스킹 검증 (누락 확인)
- 감시 로그 (모든 외부 호출 기록)

#### FR-7: Claude Validation (검증)
- 마스킹된 데이터만 Claude에 전송
- 품질 검증, 보안 체크, 성능 평가
- 개선 제안 생성
- 검증 결과 저장

#### FR-8: RAG Integration (학습 & 저장)
- Claude 검증 피드백을 RAG에 저장
- 유사 사례 검색 가능
- 향후 작업 개선에 활용
- 엔터프라이즈 지식 축적

#### FR-9: Streaming Output & Progress
- 실시간 진행 상황 표시
- 스트리밍으로 결과 출력 (완료 대기 불필요)
- 진행도 표시 (progress bar)
- 로그 파일 자동 저장

### 3.2 비기능 요구사항

| 요구사항 | 목표 | 설명 |
|---------|------|------|
| **성능** | <5초 응답 | 단순 작업은 5초 이내 |
| **확장성** | 100+ 에이전트 | 새 에이전트 쉽게 추가 |
| **보안** | 기밀 정보 0 누락 | 마스킹 정확도 99.9% |
| **가용성** | 24/7 | 언제든 사용 가능 |
| **정확도** | 95% 이상 | 작업 완료율 95% |

---

## 4. 기술 스택

### 4.1 Backend (Python Server)

```
API & Server:
├─ FastAPI (REST API + WebSocket)
├─ Uvicorn (ASGI 서버)
└─ Pydantic (데이터 검증)

CLI Framework:
├─ Typer (Python CLI)
├─ Rich (터미널 UI, 진행 상황 표시)
└─ Click (기존 CLI 호환)

LLM Integration:
├─ ollama-python (로컬 Ollama 호출)
├─ anthropic-sdk-python (Claude API)
├─ LiteLLM (LLM 추상화)
└─ langchain (프롬프트 관리, 에이전트)

Intent & NLP:
├─ spacy (자연어 처리)
├─ scikit-learn (의도 분류)
└─ sentence-transformers (임베딩)

Real-time Communication:
├─ python-socketio (WebSocket 서버)
├─ aioredis (Redis 메시지 브로커)
└─ asyncio (비동기 처리)

Data & Security:
├─ PostgreSQL (데이터베이스)
├─ Redis (세션 & 캐시)
├─ cryptography (암호화)
└─ regex + spacy NER (데이터 마스킹)

RAG & Vector Storage:
├─ weaviate 또는 milvus (벡터 DB)
├─ sentence-transformers (임베딩)
└─ PostgreSQL (메타데이터)
```

### 4.2 Frontend (Next.js Client)

```
Framework & Runtime:
├─ Next.js 14+ (React, SSR/SSG)
├─ TypeScript (타입 안전)
└─ Tailwind CSS (스타일링)

State Management:
├─ Zustand (전역 상태)
├─ TanStack Query (서버 상태 캐싱)
└─ Context API (로컬 상태)

Real-time Communication:
├─ Socket.io-client (WebSocket)
├─ React Hooks (useEffect, useCallback)
└─ Auto-reconnection 로직

UI Components:
├─ shadcn/ui (기본 컴포넌트)
├─ Recharts (차트 & 분석)
├─ React Flow (에이전트 시각화)
└─ Framer Motion (애니메이션)

API Integration:
├─ axios (HTTP 클라이언트)
├─ React Query (데이터 페칭)
└─ Error Handling & Retry

Dev Tools:
├─ ESLint & Prettier (코드 품질)
├─ Vitest & React Testing Library (테스트)
└─ Storybook (컴포넌트 카탈로그)
```

### 4.3 Infrastructure

```
Deployment:
├─ Docker (컨테이너화)
├─ Docker Compose (로컬 개발)
├─ AWS ECS/EKS (프로덕션)
└─ CI/CD (GitHub Actions)

Monitoring:
├─ Prometheus (메트릭)
├─ Grafana (대시보드)
└─ ELK Stack (로깅)

External Services:
├─ Ollama (로컬 LLM, 로컬 배포)
├─ Claude API (검증 서비스)
└─ GitHub API (저장소 관리)
```

### 4.2 Configuration

```
config/
├─ llm_config.yaml        # Ollama, Claude 설정
├─ agents_config.yaml     # 에이전트 정의
├─ intent_config.yaml     # 분류 규칙
├─ masking_rules.yaml     # 마스킹 규칙
└─ security_config.yaml   # 보안 정책
```

---

## 5. 개발 로드맵

### 5.1 Phase 1: Server Core & Intent Analysis (Week 1-2)

- [ ] FastAPI 서버 + API 라우트 구성
- [ ] Intent Classifier (rule-based + ML)
- [ ] Question Generator 기본 구현
- [ ] Session & Context Manager

**Deliverables**: REST API 동작, 기본 의도 분류 가능

### 5.2 Phase 2: LLM Integration & Agents (Week 2-3)

- [ ] LLM 추상화 계층 (Ollama, Claude)
- [ ] 기본 에이전트 4개 (Planning, Dev, Validation, Infrastructure)
- [ ] Phase Router 구현
- [ ] Multi-Agent Executor

**Deliverables**: 모든 에이전트 동작 가능

### 5.3 Phase 3: Security & RAG (Week 3-4)

- [ ] Data Masking Engine
- [ ] RAG 통합 (Weaviate + PostgreSQL)
- [ ] Audit Logging
- [ ] 보안 테스트

**Deliverables**: 기밀 정보 0 유출, RAG 학습 시작

### 5.4 Phase 4: WebSocket & Real-time (Week 4)

- [ ] WebSocket 서버 구현 (Socket.io)
- [ ] Session 실시간 이벤트 스트리밍
- [ ] Redis 기반 메시지 브로커
- [ ] 연결 관리 & Heartbeat

**Deliverables**: WebSocket 실시간 통신 완료

### 5.5 Phase 5: Web Client (Next.js) - Part 1 (Week 4-5)

- [ ] Next.js 프로젝트 구성
- [ ] 레이아웃 & 기본 페이지 구조
- [ ] API 클라이언트 (axios + TanStack Query)
- [ ] 인증 & 세션 관리 (Zustand)

**Deliverables**: 기본 웹 클라이언트 구조 완성

### 5.6 Phase 6: Dashboard & UI (Week 5-6)

- [ ] 실시간 대시보드 페이지
  - [ ] 진행 상황 모니터링 (진행도 바, 로그)
  - [ ] 작업 이력 (History)
  - [ ] 실시간 업데이트 (WebSocket 통합)
- [ ] Orchestration 대화형 페이지
  - [ ] 메시지 입력 & 표시
  - [ ] 대화 히스토리
  - [ ] 실시간 응답 스트리밍
- [ ] 프로젝트 관리 페이지
  - [ ] 프로젝트 목록
  - [ ] 프로젝트 생성/삭제
  - [ ] 결과 조회

**Deliverables**: 완전한 웹 UI 완성

### 5.7 Phase 7: Analytics & Advanced Features (Week 6-7)

- [ ] RAG 통계 대시보드
- [ ] 의도 분류 정확도 분석
- [ ] 에이전트 성능 모니터링
- [ ] 프로젝트 템플릿 시스템
- [ ] 에이전트 설정 관리 페이지

**Deliverables**: 분석 도구 & 설정 시스템 완성

### 5.8 Phase 8: Testing & Deployment (Week 7-8)

- [ ] Backend Unit & Integration Tests
- [ ] Frontend Component & E2E Tests
- [ ] 성능 테스트 (부하, 응답시간)
- [ ] 보안 감사 (OWASP, 데이터 마스킹)
- [ ] Docker 컨테이너화
- [ ] 배포 파이프라인 (CI/CD)
- [ ] 문서 & 가이드

**Deliverables**: 프로덕션 배포 준비 완료

---

## 6. 사용 흐름 상세

### 6.1 사용 예제 1: 자동 프로젝트 생성

```bash
$ ai-orchestrator create "FastAPI REST API 프로젝트"

[Intent Classification]
분류: "프로젝트 개발" (신뢰도: 98%)

[Phase 1: Questioning]
🤖 Ollama: "몇 가지 확인하겠습니다."
  ❓ 데이터베이스는? (PostgreSQL/MongoDB/SQLite)
  ❓ 인증 방식은? (JWT/OAuth/Session)
  ❓ API 버전은? (v1/v2)
👤 사용자: PostgreSQL, JWT, v1

[Phase 2: Planning]
🤖 Ollama: 기획서 작성 중...
  ✅ 프로젝트 구조
  ✅ 필요 라이브러리
  ✅ 아키텍처 다이어그램
  
📊 Claude 검증 (마스킹 데이터만)
  ✅ 구조 타당성: 좋음
  ✅ 보안: 양호 (JWT 사용)
  ✅ 확장성: 우수

[Phase 3: Development]
🤖 Ollama: 코드 생성 중...
  ✅ main.py
  ✅ models.py
  ✅ routers/users.py
  ✅ requirements.txt

📊 Claude 검증
  ✅ 코드 품질: 좋음
  ✅ 에러 처리: 적절
  ✅ 보안: 안전

[Phase 4: Save & Commit]
📁 프로젝트 생성: ./my-api/
📝 Git 커밋: "Initial project setup"
💾 RAG 저장: 프로젝트 메타데이터

[완료]
✅ 프로젝트 준비 완료!
다음 단계: $ ai-orchestrator develop "Users API 구현"
```

### 6.2 사용 예제 2: 자동 코드 검증

```bash
$ ai-orchestrator validate

[Intent Classification]
분류: "검증" (신뢰도: 95%)

[Analysis]
🔍 현재 프로젝트 분석...
  ✅ 파일 40개 발견
  ✅ 총 2,000줄 코드
  ✅ 의존성 15개

[Validation Phase]
🤖 Claude: 마스킹 코드 검증 중...
  ⚠️  보안: SQL injection 위험 발견 (line 45)
  ⚠️  성능: N+1 쿼리 패턴 (line 120)
  ✅ 에러 처리: 좋음
  ✅ 테스트 커버리지: 85%

[Recommendations]
📋 개선 사항:
  1. prepared statement 사용
  2. eager loading 활용
  3. 404 에러 처리 추가

[RAG Storage]
💾 검증 결과 저장됨
🔍 유사한 과거 사례 2개 발견

[완료]
✅ 검증 완료
$ ai-orchestrator develop "보안 이슈 수정해줘"
```

---

## 7. 마일스톤

| 마일스톤 | 목표 | 타이밍 |
|---------|------|--------|
| **M1** | Server Core + Intent Analysis 완성 | Week 2 |
| **M2** | LLM 통합 & 모든 에이전트 동작 | Week 3 |
| **M3** | 보안 & RAG 통합 완성 | Week 4 |
| **M4** | WebSocket & 실시간 통신 완성 | Week 4 |
| **M5** | 웹 클라이언트 기본 구조 완성 | Week 5 |
| **M6** | 완전한 Dashboard UI 완성 | Week 6 |
| **M7** | 분석 도구 & 설정 시스템 | Week 7 |
| **M8** | 테스트 & 배포 완료 | Week 8 |

---

## 8. 팀 구성

| 역할 | 인원 | 책임 |
|------|------|------|
| **Senior Backend Engineer** | 1 | FastAPI 서버, LLM 통합, CLI 구조 |
| **Frontend Engineer** | 1 | Next.js, 대시보드, Embedded Terminal |
| **Junior Backend Engineer** | 1 | Intent Classification, 에이전트 |
| **Security Engineer** | 0.5 | 데이터 마스킹, 감시 시스템 |
| **DevOps** | 0.5 | 배포, Docker, 모니터링, RAG 인프라 |

---

## 9. 예상 비용 (비용 최적화)

### 개발 비용
| 항목 | 금액 |
|------|------|
| 개발팀 (8주) | $18-24K |
| **개발 비용 소계** | **$18-24K** |

### 운영 비용 (월)
| 항목 | 비용 | 설명 |
|------|------|------|
| **Claude API** | $50-150 | 검증 단계만 (마스킹 데이터) |
| **Ollama (로컬)** | $0 | 무료 (self-hosted) |
| **PostgreSQL + Redis** | $20-50 | 자체 서버 또는 저비용 클라우드 |
| **Weaviate (Vector DB)** | $0 | 자체 배포 |
| **서버 인프라** | $100-300 | AWS/GCP 기본 서버 |
| **모니터링/로깅** | $20-50 | 기본 스택 |
| **월 합계** | **$190-550** | |

### 연간 비용 예상
| 구분 | 금액 |
|------|------|
| 개발 (일회) | $18-24K |
| 운영 (연) | $2.3-6.6K |
| **연간 합계** | **$20-31K** |

**비용 절감 포인트:**
- ✅ **Ollama 로컬 무료**: 기획, 개발, 문서화는 로컬에서 처리
- ✅ **Claude API 최소화**: 검증 단계에서만 호출 (월 $50-150)
- ✅ **Embedded CLI 구조**: 웹 대시보드에서 필요시만 외부 API 호출
- ✅ **자체 인프라**: Vector DB, 캐시 서버 모두 자체 배포 가능

---

## 최종 요약

### 핵심 아키텍처
✅ **Dual Interface**: CLI (로컬) + Web Dashboard (원격)  
✅ **Embedded Terminal**: 웹 대시보드 내 CLI 실행 환경  
✅ **Server-centric**: FastAPI 중앙 서버  
✅ **Minimal Cost**: Ollama (무료) + Claude API (필요시만)  
✅ **Smart Orchestration**: 자동 의도 분류 & 에이전트 분배  
✅ **Real-time Monitoring**: WebSocket + 실시간 스트리밍  
✅ **Security First**: 데이터 마스킹 + Zero Trust  
✅ **Continuous Learning**: RAG 통합 & 과거 사례 활용

### 주요 특징
1. **Server-based**: FastAPI 기반 중앙 서버 (포트 8000)
2. **Web Dashboard**: Next.js (포트 3000) - 실시간 모니터링
3. **Embedded Terminal**: 웹 내 xterm.js 기반 터미널
   - Claude API 필요시 자동 실행
   - 마스킹 데이터만 전송
   - 완료 후 자동 닫힘
4. **Streaming Output**: 모든 작업 실시간 스트리밍
5. **Session Management**: 웹/CLI 간 세션 공유
6. **Project Isolation**: 프로젝트별 독립적 컨텍스트
7. **Cost Optimized**:
   - 기획/개발/문서화: Ollama (무료)
   - 검증: Claude API (마스킹 데이터만)
   - 월 비용: $190-550

### 사용 시나리오
| 시나리오 | 방식 | 비용 |
|---------|------|------|
| 기획서 작성 | Ollama | 무료 |
| 코드 생성 | Ollama | 무료 |
| 코드 검증 | Embedded CLI + Claude | 소액 |
| 프로젝트 관리 | 웹 대시보드 | 무료 |
| 분석 및 통계 | RAG 기반 | 무료 |

### 차별점
- **웹 중심**: 웹 대시보드에서 모든 작업 수행
- **CLI 통합**: 필요시 터미널에서 직접 제어
- **투명성**: 사용자가 API 호출 과정을 볼 수 있음
- **비용 효율**: 로컬 우선, 외부 API 최소화
- **지속적 개선**: RAG로 과거 사례 활용

### 다음 단계
**Design Phase 완료** → **Do Phase 시작**
- Phase 1-8 구현 로드맵 제공
- 각 단계별 deliverable 명시
- 8주 개발 일정

---

**Plan 문서 버전**: 3.3 (Embedded CLI Architecture)  
**마지막 수정**: 2026-05-12  
**상태**: ✅ Design Phase 완료, Do Phase 준비 완료
