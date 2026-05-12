# 프로덕션 배포 가이드 - AI Orchestrator Web Dashboard

## 배포 완료: 2026-05-12

**배포 상태**: ✅ PRODUCTION READY  
**외부 접속 주소**: http://172.237.14.73/ai/  
**내부 접속 주소**: http://localhost/ai/

---

## 1. 배포 아키텍처

```
┌─────────────────┐
│  Internet User  │
│ 172.237.14.73   │
└────────┬────────┘
         │ HTTP port 80
         │
    ┌────▼──────────────┐
    │  Nginx (port 80)  │
    │  Reverse Proxy    │
    └────┬──────────────┘
         │
         ├─── location /     ──────→ Hospital RUN (port 3000)
         └─── location /ai/ ──────→ Next.js (port 3200)
                                      │
                                      ├─ /ai/  [static]
                                      ├─ /ai/orchestrate
                                      ├─ /ai/history
                                      ├─ /ai/rag
                                      └─ /ai/projects
                                      
                             ┌────────────────────┐
                             │  FastAPI (port 4500)
                             │  Backend API       │
                             └────────────────────┘
```

---

## 2. 배포 설정

### 2.1 Next.js 설정 (web/next.config.ts)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/ai',
  trailingSlash: true,  // 중요: /ai/ 경로 일관성
};

export default nextConfig;
```

**왜 필요한가:**
- `basePath: '/ai'` - 모든 링크를 `/ai` 프리픽스로 변환
- `trailingSlash: true` - `/ai/`에서 `/ai`로 리다이렉트하지 않음

### 2.2 Nginx 설정 (/etc/nginx/sites-available/default)

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # 기존 서비스 (Hospital RUN)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    # AI Orchestrator
    location /ai/ {
        proxy_pass http://localhost:3200/ai/;  # 경로 유지 (rewrite 금지)
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

**중요 설정 포인트:**
- `proxy_pass http://localhost:3200/ai/;` - 경로를 그대로 전달
- ❌ `rewrite ^/ai/(.*) /$1 break;` 사용 금지
- Nginx는 `/etc/nginx/sites-enabled/` 에 심볼릭 링크로 활성화

### 2.3 환경 변수 설정

**web/.env.local:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:4500
NEXT_PUBLIC_WERUB_URL=https://weve.io.kr/ollama
```

**api/.env:**
```bash
DEBUG=false
LOG_LEVEL=INFO
WERUB_BASE_URL=https://weve.io.kr/ollama
WERUB_API_KEY=<your-api-key>
REDIS_URL=redis://localhost:6379
REDIS_DB=0
SESSION_TTL_HOURS=24
```

---

## 3. 배포 프로세스

### 3.1 서버 준비

```bash
# Python venv 설정
cd /home/weruby/Dev_AI/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Next.js 빌드
cd /home/weruby/Dev_AI/web
npm install
npm run build
```

### 3.2 서비스 시작

```bash
# API 서버 (포트 4500)
cd /home/weruby/Dev_AI/api
source venv/bin/activate
python -m uvicorn main:app --port 4500 --host 127.0.0.1 &

# Next.js 프로덕션 서버 (포트 3200)
cd /home/weruby/Dev_AI/web
npm run start -- --port 3200 &
```

### 3.3 Nginx 설정 적용

```bash
# sites-enabled에 default 활성화
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# 설정 검증
sudo nginx -t

# 재로드
sudo systemctl reload nginx
```

---

## 4. 배포 중 발생한 문제와 해결책

### 문제 1: 404 Not Found

**증상**: `/ai/` 접속 시 404 에러

**원인**: Next.js에 `basePath: '/ai'` 설정이 없음

**해결**: next.config.ts에 basePath 추가

```typescript
basePath: '/ai'
```

---

### 문제 2: Nginx rewrite 문제

**증상**: `/ai/` 요청이 `/`로 변환되어 Next.js가 404 반환

**원인**: Nginx 설정에서 URL rewrite 사용
```nginx
rewrite ^/ai/(.*) /$1 break;  # ❌ 잘못된 설정
```

**해결**: rewrite 제거, 경로 그대로 전달
```nginx
proxy_pass http://localhost:3200/ai/;  # ✅ 올바른 설정
```

---

### 문제 3: 무한 리다이렉트 루프

**증상**: `/ai/` → `/ai` → `/ai/` → ... (ERR_TOO_MANY_REDIRECTS)

**원인**: 
- Nginx: `/ai` → `/ai/` 리다이렉트
- Next.js: `/ai/` → `/ai` 리다이렉트 (trailingSlash 미설정)

**해결**: trailingSlash 설정
```typescript
const nextConfig: NextConfig = {
  basePath: '/ai',
  trailingSlash: true,  // 항상 /ai/ 형태 유지
};
```

---

### 문제 4: Nginx sites-enabled 미활성화

**증상**: /etc/nginx/sites-available/default 설정이 무시됨

**원인**: Nginx는 sites-available의 파일을 자동 로드하지 않음

**해결**: sites-enabled에 심볼릭 링크 생성
```bash
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
```

---

## 5. 접속 테스트

### 로컬 서버에서
```bash
# Next.js 직접 (포트 3200)
curl -I http://localhost:3200/ai/
# → HTTP/1.1 200 OK

# Nginx 프록시 (포트 80)
curl -I http://localhost/ai/
# → HTTP/1.1 200 OK
```

### 외부에서
```bash
# 브라우저
http://172.237.14.73/ai/

# curl
curl -I http://172.237.14.73/ai/
# → HTTP/1.1 200 OK
```

---

## 6. 주요 학습사항

### ✅ 성공한 패턴

1. **Path-based Routing** - 단일 포트(80)에서 여러 서비스 운영
2. **basePath + trailingSlash** - Next.js 서브경로 배포의 핵심
3. **Nginx proxy_pass** - rewrite 대신 proxy_pass 사용
4. **환경 변수 관리** - .env 파일로 설정 분리

### ⚠️ 피해야 할 패턴

1. ❌ Nginx `rewrite` - 프록시 환경에서는 경로 변환 피하기
2. ❌ `trailingSlash: false` - 리다이렉트 루프 유발
3. ❌ sites-available 파일만 생성 - sites-enabled에 심볼릭 링크 필수
4. ❌ `proxy_pass http://localhost:3200;` - 경로 손실, 반드시 `/ai/` 포함

---

## 7. 모니터링 및 유지보수

### 로그 확인
```bash
# Nginx 에러
sudo tail -f /var/log/nginx/error.log

# Nginx 접근
sudo tail -f /var/log/nginx/access.log

# Next.js
tail -f /tmp/nextjs.log

# API
tail -f /tmp/api.log
```

### 프로세스 확인
```bash
# 실행 중인 서비스
lsof -i :80      # Nginx
lsof -i :3200    # Next.js
lsof -i :4500    # FastAPI
```

### 성능 테스트
```bash
# 응답 시간 측정
time curl http://localhost/ai/ > /dev/null

# 동시 연결 테스트
ab -n 100 -c 10 http://localhost/ai/
```

---

## 8. 배포 체크리스트

- [x] Next.js `basePath: '/ai'` 설정
- [x] Next.js `trailingSlash: true` 설정
- [x] Nginx `/ai/` location 블록 생성
- [x] Nginx sites-enabled에 default 심볼릭 링크
- [x] API 서버 포트 4500 실행
- [x] Next.js 서버 포트 3200 실행
- [x] Nginx 재로드
- [x] 로컬 접속 테스트 (http://localhost/ai/)
- [x] 외부 접속 테스트 (http://172.237.14.73/ai/)

---

## 9. 참고자료

- Next.js basePath: https://nextjs.org/docs/app/api-reference/next-config-js/basePath
- Next.js trailingSlash: https://nextjs.org/docs/app/api-reference/next-config-js/trailingSlash
- Nginx proxy_pass: https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass

---

**마지막 업데이트**: 2026-05-12  
**배포 담당자**: weruby@172.237.14.73  
**상태**: 🟢 Production
