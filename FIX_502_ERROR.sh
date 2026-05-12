#!/bin/bash
# 502 Bad Gateway 오류 해결 스크립트

echo "🔧 프로덕션 서버 상태 점검 및 복구..."
echo ""

# 1. 실행 중인 Node/Python 프로세스 확인
echo "1️⃣ 현재 실행 중인 프로세스:"
pgrep -f "npm run start" && echo "  ✓ Next.js 서버 실행 중" || echo "  ✗ Next.js 서버 미실행"
pgrep -f "uvicorn" && echo "  ✓ API 서버 실행 중" || echo "  ✗ API 서버 미실행"
echo ""

# 2. 포트 바인딩 확인
echo "2️⃣ 포트 상태:"
netstat -tuln 2>/dev/null | grep -E "3200|4500|6379" || echo "  포트 정보 확인 중..."
echo ""

# 3. 코드 최신화
echo "3️⃣ Git 코드 최신화:"
cd /home/weruby/Dev_AI
git pull origin main
echo ""

# 4. Next.js 빌드 및 시작
echo "4️⃣ Next.js 빌드:"
cd /home/weruby/Dev_AI/web
npm run build
echo ""

echo "5️⃣ Next.js 서버 재시작:"
pkill -f "npm run start" || true
sleep 2
npm run start -- --port 3200 > /tmp/nextjs.log 2>&1 &
sleep 3
pgrep -f "npm run start" && echo "  ✓ Next.js 서버 시작됨" || echo "  ✗ Next.js 서버 시작 실패"
echo ""

# 5. API 서버 상태 확인
echo "6️⃣ API 서버 상태:"
pgrep -f "uvicorn" && echo "  ✓ API 서버 실행 중" || {
  echo "  ⚠️ API 서버 미실행 - 수동으로 시작 필요:"
  echo "    cd /home/weruby/Dev_AI/api"
  echo "    source venv/bin/activate"
  echo "    python -m uvicorn main:app --port 4500 --host 127.0.0.1 &"
}
echo ""

# 6. Nginx 재로드
echo "7️⃣ Nginx 재로드:"
sudo nginx -t && sudo systemctl reload nginx && echo "  ✓ Nginx 재로드 완료" || echo "  ✗ Nginx 재로드 실패"
echo ""

# 7. 최종 확인
echo "8️⃣ 최종 확인 (10초 대기):"
sleep 10
echo ""
echo "💻 로컬 테스트:"
curl -I http://localhost:3200/ai/ | head -3
echo ""
echo "🌐 외부 접속 테스트:"
echo "  http://172.237.14.73/ai/ 접속하여 확인하세요"
echo ""
echo "📋 로그 확인:"
echo "  tail -f /tmp/nextjs.log  (Next.js 로그)"
