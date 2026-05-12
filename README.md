# AI Orchestrator Web Dashboard

WeRU.B AI Server 기반의 자동 워크플로우 실행 웹 대시보드

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
# API 서버 (포트 4500)
cd /home/weruby/Dev_AI/api
source venv/bin/activate
python -m uvicorn main:app --port 4500 --host 127.0.0.1 &

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
