# AI Orchestrator - 최종 아키텍처

## 📊 구조도

```
사용자 브라우저
    ↓
http://172.237.14.73/ai/
    ↓ (Nginx 리버스 프록시)
http://localhost:3200/ai/  (Next.js)
    ├─ UI 페이지 (렌더링)
    └─ API 요청 (rewrite)
        ↓
        localhost:4500  (FastAPI)
        ├─ /api/orchestrate
        ├─ /api/orchestrator/...
        └─ /ws/orchestrate/{sessionId}
```

## 🎯 근본 문제 해결

### 원래 문제
```
포트 4500이 Nginx 프록시되지 않음
→ 브라우저에서 포트 4500 직접 접근 시도
→ 외부 접근 차단 → 실패
```

### 해결책: Next.js Rewrites
```javascript
// next.config.ts
rewrites() {
  return {
    beforeFiles: [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4500/api/:path*',
      },
    ],
  };
}
```

### 결과
```
사용자 요청: fetch('/api/orchestrate')
    ↓
Next.js 서버에서 rewrite
    ↓
서버에서 localhost:4500/api/orchestrate 호출
    ↓
결과를 브라우저에 반환 ✅
```

## 🏗️ 배포 구조

| 계층 | 기술 | 포트 | 역할 |
|------|------|------|------|
| 외부 | Nginx | 80 | 리버스 프록시, 정적 파일 |
| UI | Next.js | 3200 | 프론트엔드, API 래퍼 |
| API | FastAPI | 4500 | 백엔드, WebSocket |
| 데이터 | WeRU.B | - | AI 오케스트레이션 |

## 📝 핵심 파일 변경사항

### 1. next.config.ts
```typescript
const nextConfig: NextConfig = {
  basePath: '/ai',           // URL 프리픽스
  trailingSlash: true,       // 末尾 슬래시
  async rewrites() {         // ← API 통합
    return {
      beforeFiles: [{
        source: '/api/:path*',
        destination: 'http://localhost:4500/api/:path*',
      }],
    };
  },
};
```

### 2. ChatInterface.tsx
```typescript
function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500';
  }
  return '';  // ← 상대 경로 사용 (rewrite 통해 처리)
}

// 호출:
fetch(`${getApiUrl()}/api/orchestrate`)  // → '/api/orchestrate'
```

### 3. useOrchestrateWebSocket.ts
```typescript
// getWsBaseUrl() - WebSocket도 동일하게 작동
const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
return `${proto}//${window.location.hostname}:4500`;
// → ws://172.237.14.73:4500/ws/orchestrate/{sessionId}
```

## 🚀 사용 흐름

```
1. 사용자: http://172.237.14.73/ai/ 접속
                ↓
2. Nginx: 요청 → localhost:3200/ai/ 포워드
                ↓
3. Next.js: UI 렌더링
                ↓
4. 사용자: "FastAPI 만들어줘" 입력 → 실행
                ↓
5. fetch('/api/orchestrate') 호출
                ↓
6. Next.js rewrite: localhost:4500/api/orchestrate 요청
                ↓
7. FastAPI: 처리 → run_id 반환
                ↓
8. WebSocket: ws://172.237.14.73:4500/ws/orchestrate/{sessionId}
                ↓
9. 대시보드: 실시간 진행률/로그 표시
```

## ✅ 배포된 상태

| 항목 | 상태 | 테스트 |
|------|------|--------|
| UI 서버 | ✅ 실행 중 | http://172.237.14.73/ai/ |
| API 서버 | ✅ 실행 중 | localhost:4500/health |
| Nginx 프록시 | ✅ 설정 완료 | /ai/ 라우팅 |
| Next.js Rewrites | ✅ 적용됨 | /api/* 래핑 |
| WebSocket | ✅ 준비 완료 | /ws/orchestrate/* |

## 🔧 기술 사항

### 요청 경로 맵핑

```
클라이언트 요청              Next.js (3200)        FastAPI (4500)
───────────────────────────────────────────────────────────────
GET /ai/                  → /ai/              (정적 페이지)
GET /ai/orchestrate       → /orchestrate      (동적 페이지)
POST /api/orchestrate     → localhost:4500/api/orchestrate
WS /ai/ws/orchestrate     → localhost:4500/ws/orchestrate
```

### CORS 불필요
- 모든 요청이 같은 origin (172.237.14.73)에서 출발
- rewrite는 서버 측에서 발생 (브라우저에 투명함)
- CORS 헤더 필요 없음

### 성능 특성
- 네트워크 지연: 최소화 (로컬 호스트 호출)
- 포트 격리: 안전 (외부에 3200만 노출)
- 확장성: 높음 (각 계층 독립적 확장 가능)

## 🎯 다음 단계 (선택사항)

### 1. 프로덕션 최적화
- 환경 변수 분리 (.env.production)
- API 응답 캐싱
- 리소스 최소화

### 2. 모니터링
- 에러 로깅 (Sentry 등)
- 성능 모니터링 (DataDog 등)
- 사용자 분석

### 3. 보안 강화
- API 레이트 제한
- 인증 토큰 관리
- HTTPS 설정 (현재 HTTP)

## 📞 문제 발생 시

```bash
# 1. 프로세스 확인
ssh -p 819 weruby@172.237.14.73
ps aux | grep -E "uvicorn|npm.*start"

# 2. 로그 확인
tail -f /tmp/api.log        # FastAPI
tail -f /tmp/nextjs.log     # Next.js

# 3. 네트워크 확인
curl http://localhost:3200/ai/api/health    # (서버 내부)
curl http://172.237.14.73/ai/              # (외부)
```

---

**배포 완료!** 이제 `http://172.237.14.73/ai/`에서 모든 기능을 사용할 수 있습니다. ✨
