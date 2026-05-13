# AI Orchestrator Web Dashboard - ⛔ PROJECT DEPRECATED

**상태**: 🔴 **프로젝트 폐기** (2026-05-13)  
**사유**: 근본적인 아키텍처 설계 오류로 인한 개발 중단

---

## 📌 프로젝트 폐기 사유

### 실패 원인 분석

#### 1. WebSocket 구현 실패
- **문제**: Python 모듈 시스템에서 MOCK_MODE 클라이언트 대체 불가
- **증상**: 
  - 405 Method Not Allowed 에러
  - 개발 환경에서 모의 객체(MockWeRUClient) 주입 실패
  - 실제 WeRU.B API 호출 강제

```python
# 시도한 방법 (실패)
import clients.weru_client as weru_module
if settings.MOCK_MODE:
    weru_module.weru_client = MockWeRUClient()  # ❌ import 후 대체 불가
```

#### 2. 근본적인 아키텍처 문제
- **WebSocket 구현**: SSE (Server-Sent Events) 시도 → 실시간 스트리밍 미지원
- **실시간 통신**: Next.js와 Python FastAPI 간 비호환성
- **상태 관리**: 클라이언트/서버 간 상태 동기화 불가능
- **배포 복잡도**: Docker + Nginx + 멀티포트 관리의 복잡성

#### 3. 기술 스택 부적절성
- Next.js 개발 서버 (포트 3000)
- FastAPI 백엔드 (포트 4500/8000)  
- CORS/프록시 문제로 인한 지속적 설정 변경
- 로컬 개발과 프로덕션 환경 불일치

### 실패 기록

**주요 이슈:**
1. `WebSocket_Fix_Summary.md` - WebSocket 수정 시도 실패
2. `FUNDAMENTAL_ARCHITECTURE_ISSUE.md` - 근본적 설계 문제 문서화
3. `FIX_ACTION_PLAN.md` - 수정 계획 수립 (미실행)
4. 최종 커밋: `76659ff Fix: Restart implementation with proper architecture` (미완료)

**최종 상태:**
- 로컬: 부분 완성 (UI 60%, API 40%)
- 서버: 운영 중 (172.237.14.73)
- 테스트: 실패 (405 에러)

---

## 📊 프로젝트 정리 (2026-05-13)

### 정리 내용

**로컬 (2026-05-13 09:33 UTC)**
- ✅ web/ (486MB) 삭제
- ✅ api/ (34MB) 삭제
- ✅ docs/ (344KB) 삭제
- ✅ docker-compose.yml 삭제
- ✅ .env.local 삭제
- ✅ Git 커밋: `135f8df cleanup: Remove Dev_AI project`

**서버 (172.237.14.73, 2026-05-13 12:37 UTC)**
- ✅ uvicorn (포트 4500) 종료
- ✅ /home/weruby/Dev_AI/ (724MB) 삭제
- ✅ Nginx 설정 제거
- ✅ 온라인 서비스 중단

### 영향도 분석
- ✅ 다른 프로젝트 영향 없음 (독립적 구조)
- ✅ GitHub_project 내 다른 서비스 무관
- ✅ 데이터 백업: ~/Backup/Dev_AI_backup_20260513/

---

## 📚 학습 내용

### 해결되지 않은 기술적 과제
1. **Python 동적 모듈 로딩**: 런타임 클라이언트 대체 불가
2. **Next.js ↔ FastAPI 실시간 통신**: CORS/WebSocket 호환성 이슈
3. **멀티포트 아키텍처**: 개발/배포 환경의 포트 불일치

### 권장 사항
향후 유사 프로젝트는 다음 구조를 권장:
- **옵션 1**: Next.js 풀스택 (API Routes + Vercel)
- **옵션 2**: Python FastAPI 풀스택 (no Next.js)
- **옵션 3**: 의존성 주입 패턴 사용 (Factory Pattern)

---

## 📋 프로젝트 메타데이터

| 항목 | 값 |
|------|-----|
| **시작 날짜** | 2026-05-12 |
| **종료 날짜** | 2026-05-13 |
| **기간** | 1일 |
| **원인** | 아키텍처 설계 오류 |
| **정리 상태** | ✅ 완료 |
| **저장소** | https://github.com/seanshin/devAI.git |
| **마지막 커밋** | 135f8df (cleanup) |

---

## 🔗 관련 문서 (보관용)

프로젝트 정리 전 생성된 문서:
- `CLEANUP_PLAN.md` - 정리 계획서
- `COMPLETION_REPORT.md` - 완료 보고서 (미달성)
- `WEBSOCKET_FIX_SUMMARY.md` - 수정 시도 기록
- `FUNDAMENTAL_ARCHITECTURE_ISSUE.md` - 근본 원인 분석

---

## ⚙️ 레거시 정보 (참고용)

WeRU.B AI Server 기반의 자동 워크플로우 실행 웹 대시보드 (프로젝트 폐기됨)

## 프로젝트 구조

```
.
├── web/                    # Next.js Frontend
│   ├── app/               # App router
│   ├── components/        # React components
│   ├── lib/              # Utilities & stores
│   ├── package.json
│   └── Dockerfile
│
├── api/                   # FastAPI Backend
│   ├── clients/          # WeRU.B API client
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth & session
│   ├── main.py          # FastAPI app
│   ├── config.py        # Configuration
│   ├── requirements.txt
│   ├── Dockerfile
│   └── test_main.py     # Tests
│
├── docs/                  # Documentation
│   ├── 01-plan/         # Planning docs
│   └── 02-design/       # Design docs
│
├── docker-compose.yml     # Local development
└── .gitignore
```

## 🚀 빠른 시작

### 프로덕션 배포 (온라인)

**✅ 현재 실행 중:**
- 🌐 **웹 대시보드**: http://172.237.14.73/ai/
- 📡 **API 서버**: localhost:4500 (내부)
- 📋 **배포 문서**: [PRODUCTION_DEPLOYMENT.md](docs/05-deployment/PRODUCTION_DEPLOYMENT.md)

---

### 로컬 개발 (Docker)

```bash
docker-compose up
```

- Web Frontend: http://localhost:3000
- API Backend: http://localhost:8000
- Redis: localhost:6379

### 로컬 개발 (수동 실행)

#### Frontend
```bash
cd web
npm install
npm run dev
```

#### Backend
```bash
cd api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

#### Redis (별도 터미널)
```bash
redis-server
```

## 개발 단계

### Phase 1 ✅ - Web Dashboard UI
- Next.js 프로젝트 초기화
- 기본 컴포넌트 구성
- Zustand 상태 관리
- Tailwind CSS 스타일링

### Phase 2 🔄 - API 통합
- FastAPI 프록시 서버
- WeRU.B API 클라이언트 래퍼
- 기본 라우트 구현
- Redis 세션 관리
- Docker 컨테이너화

### Phase 3 - 실시간 스트리밍
- WebSocket 구현
- SSE → WebSocket 변환
- 실시간 모니터링

### Phase 4 - Embedded Terminal
- xterm.js 통합
- 웹 내 CLI 실행

### Phase 5 - 추가 기능
- 결과 다운로드
- 이력 조회
- RAG 검색 통합

### Phase 6 - 테스트 & 배포
- E2E 테스트
- 배포 준비

## API 엔드포인트

### Orchestrator
- `POST /api/orchestrate` - 자연어 입력으로 워크플로우 시작
- `GET /api/orchestrate/{run_id}/status` - 실행 상태 조회
- `GET /api/orchestrate/history` - 실행 이력 조회

### RAG 검색
- `POST /api/rag/search` - 벡터 검색
- `POST /api/rag/ask` - 질문에 답변

### CLI 실행
- `POST /api/cli/execute` - 명령 실행

### Health Check
- `GET /health` - 상태 확인
- `GET /` - 정보 조회

## 환경 설정

### Frontend (.env.local)
```bash
# 개발용
NEXT_PUBLIC_API_URL=http://localhost:8000

# 프로덕션
NEXT_PUBLIC_API_URL=http://localhost:4500

# 공통
NEXT_PUBLIC_WERUB_URL=https://weve.io.kr/ollama
```

### Backend (.env)
```bash
# 애플리케이션
DEBUG=false
LOG_LEVEL=INFO

# WeRU.B 서버
WERUB_BASE_URL=https://weve.io.kr/ollama
WERUB_API_KEY=<your-api-key>

# Redis
REDIS_URL=redis://localhost:6379
REDIS_DB=0

# 세션
SESSION_TTL_HOURS=24
```

## 기술 스택

### Frontend
- Next.js 14+
- React
- TypeScript
- Tailwind CSS
- Zustand (상태관리)
- Socket.io (WebSocket)
- xterm.js (Terminal UI)

### Backend
- FastAPI
- Pydantic
- Redis
- aiohttp
- pytest

### External
- WeRU.B AI Server v2.33.0

## 테스트

```bash
cd api
source venv/bin/activate
pytest -v
```

## 빌드 & 배포

### Docker Build (개발용)
```bash
docker-compose build
```

### Production Deploy (온라인 서버)

**배포 서버**: 172.237.14.73 (Ubuntu 24.04)

#### 1. 서버 준비
```bash
# Git clone
git clone https://github.com/seanshin/devAI.git
cd Dev_AI

# Python 환경 설정
cd api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Node 환경 설정
cd ../web
npm install
npm run build
```

#### 2. 서비스 시작
```bash
# API 서버 (포트 4500) - 0.0.0.0으로 외부 접근 허용
cd /home/weruby/Dev_AI/api
source venv/bin/activate
python -m uvicorn main:app --port 4500 --host 0.0.0.0 &

# Next.js 프로덕션 서버 (포트 3200)
cd /home/weruby/Dev_AI/web
npm run start -- --port 3200 &
```

#### 3. Nginx 설정
```bash
# 설정 파일 활성화
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# 검증 및 재로드
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. 확인
```bash
# 로컬에서
curl -I http://localhost/ai/
# → HTTP/1.1 200 OK

# 외부에서
curl -I http://172.237.14.73/ai/
# → HTTP/1.1 200 OK
```

**자세한 내용**: [PRODUCTION_DEPLOYMENT.md](docs/05-deployment/PRODUCTION_DEPLOYMENT.md)

## 문제 해결

### Redis 연결 실패
```bash
# Redis 상태 확인
redis-cli ping  # PONG 응답
```

### WeRU.B API 오류
- `.env`의 `WERUB_API_KEY` 확인
- WeRU.B 서버 상태 확인: https://weve.io.kr/ollama

### 포트 충돌
포트 3000, 8000, 6379이 사용 중이 아님을 확인하세요.

## 라이센스

TBD

## 문의

기술 관련 질문은 이슈를 생성해주세요.
