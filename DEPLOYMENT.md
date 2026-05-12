# 배포 가이드 (Deployment Guide)

## 개요

AI Orchestrator Web Dashboard는 Docker Compose를 사용하여 로컬에서 테스트하거나 클라우드 환경에 배포할 수 있습니다.

## 사전 준비

### 필수 소프트웨어
- Docker >= 20.10
- Docker Compose >= 2.0
- Git

### 환경 변수

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WERUB_URL=https://weve.io.kr/ollama
```

#### Backend (.env)
```bash
DEBUG=false
LOG_LEVEL=INFO
WERUB_BASE_URL=https://weve.io.kr/ollama
WERUB_API_KEY=<your-api-key>
REDIS_URL=redis://redis:6379
REDIS_DB=0
```

## 로컬 개발 환경 (Docker Compose)

### 1. 프로젝트 클론
```bash
git clone <repository>
cd Dev_AI
```

### 2. 환경 변수 설정
```bash
# Frontend
cd web
cp .env.local.example .env.local  # 또는 직접 편집

# Backend
cd ../api
cp .env.example .env  # 또는 직접 편집
```

### 3. Docker Compose 실행
```bash
cd ..
docker-compose up
```

### 4. 서비스 접근
- **Web Dashboard**: http://localhost:3000
- **API Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Redis**: localhost:6379

## 단계별 배포

### Step 1: Docker 이미지 빌드
```bash
docker-compose build
```

### Step 2: 이미지 확인
```bash
docker images | grep orchestrator
```

### Step 3: 컨테이너 실행
```bash
# 백그라운드 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f api
docker-compose logs -f web
```

### Step 4: 상태 확인
```bash
# 실행 중인 컨테이너
docker-compose ps

# 헬스 체크
curl http://localhost:8000/health
curl http://localhost:3000
```

## 클라우드 배포 (AWS EC2)

### 1. EC2 인스턴스 생성
```bash
# Ubuntu 20.04 LTS 선택
```

### 2. Docker 설치
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
```

### 3. 프로젝트 배포
```bash
git clone <repository>
cd Dev_AI
```

### 4. 환경 변수 설정
```bash
# 프로덕션 환경 변수 설정
nano api/.env
nano web/.env.local
```

### 5. 실행
```bash
docker-compose -f docker-compose.yml up -d
```

## 모니터링

### 로그 확인
```bash
docker-compose logs -f

# 특정 시간 범위
docker-compose logs --since 2h
docker-compose logs --tail 100
```

### 컨테이너 상태
```bash
docker-compose ps
docker stats
```

### 리소스 사용량
```bash
# Redis 메모리 사용량
docker-compose exec redis redis-cli INFO memory

# 디스크 사용량
docker system df
```

## 문제 해결

### Redis 연결 실패
```bash
# Redis 상태 확인
docker-compose exec redis redis-cli ping

# Redis 재시작
docker-compose restart redis
```

### API 연결 실패
```bash
# API 로그 확인
docker-compose logs api

# API 재시작
docker-compose restart api
```

### 포트 이미 사용 중
```bash
# 포트 확인
lsof -i :3000
lsof -i :8000
lsof -i :6379

# 기존 프로세스 중지
kill -9 <PID>

# 또는 포트 변경
# docker-compose.yml에서 포트 변경
```

## 데이터 관리

### Redis 데이터 백업
```bash
docker-compose exec redis redis-cli BGSAVE
docker cp orchestrator_redis_1:/data/dump.rdb ./backup/
```

### Redis 데이터 복원
```bash
docker cp ./backup/dump.rdb orchestrator_redis_1:/data/
docker-compose restart redis
```

### 로그 정리
```bash
docker-compose down
docker system prune -a
```

## 보안 체크리스트

- [ ] WeRU.B API 키 설정 (WERUB_API_KEY)
- [ ] DEBUG=false (프로덕션)
- [ ] CORS 설정 확인
- [ ] SSL/TLS 인증서 설정 (https)
- [ ] 방화벽 규칙 확인
- [ ] 정기적인 백업 설정
- [ ] 로그 모니터링 설정

## 스케일링

### 다중 API 인스턴스
```yaml
services:
  api1:
    build: ./api
    ports:
      - "8001:8000"
  
  api2:
    build: ./api
    ports:
      - "8002:8000"
  
  nginx:
    image: nginx:latest
    ports:
      - "8000:8000"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

## 성능 최적화

### Redis 성능 튜닝
```bash
# 메모리 정책 설정
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Next.js 빌드 최적화
```bash
# 프로덕션 빌드
npm run build

# 캐시 활성화
npm run start
```

## CI/CD 통합

### GitHub Actions 예시
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and push
        run: |
          docker-compose build
          docker-compose push
      - name: Deploy
        run: |
          ssh user@server 'cd /app && docker-compose pull && docker-compose up -d'
```

## 지원 및 문의

- 문제 발생: GitHub Issues 생성
- 기술 문의: 개발팀 연락
- API 문서: http://localhost:8000/docs

## 버전 관리

### 현재 버전
- Web: v1.0.0
- API: v1.0.0
- Docker: v1.0.0

### 업그레이드
```bash
git pull origin main
docker-compose pull
docker-compose up -d
```
