# Dev_AI 프로젝트 정리 기획서 (Cleanup Plan)

**작성일**: 2026-05-13  
**상태**: 🔴 미실행  
**영향도**: 로컬 개발 환경 + 프로덕션 서버 (172.237.14.73)  

---

## 📋 목표

Dev_AI 프로젝트를 체계적으로 정리하면서 **기존 서비스 영향 없이** 완전히 제거

---

## 📊 현재 상태 분석

### 프로젝트 구성
- **웹앱**: Next.js (web/) - 포트 3000 (dev), 3200 (prod)
- **API**: FastAPI (api/) - 포트 4500
- **인프라**: Redis (6379), PostgreSQL (5432)
- **배포**: 172.237.14.73 (Ubuntu) - 온라인 서비스 중

### 의존성 분석
| 서비스 | 의존처 | 영향도 |
|--------|--------|--------|
| 웹앱 → API | 로컬/서버 | **상호의존** |
| API → Redis | 로컬/서버 | **의존** |
| API → PostgreSQL | 로컬/서버 | **의존** |
| API → WeRU.B | 외부 | **의존** |

### 기존 서비스 확인
- **GitHub_project 내 다른 프로젝트**: bbs, email, flarum, NodeBB 등 (무관)
- **시스템 서비스**: macOS ControlCenter, rapportd, OneDrive (무관)

**결론**: Dev_AI만 정리하면 다른 서비스 영향 없음 ✅

---

## 🎯 정리 전략

### Phase 1: 사전 점검 & 백업
**목표**: 데이터 손실 방지, 복구 가능성 확보

#### 1.1 로컬 백업
```bash
# 중요 설정/데이터 백업
- .env.local (환경 변수)
- api/.env (API 설정)
- PostgreSQL 덤프
- Git 히스토리
```

**담당**: 로컬 개발 환경
**예상 시간**: 15분
**체크리스트**:
- [ ] PostgreSQL 데이터 덤프 (pg_dump)
- [ ] Redis 데이터 백업
- [ ] Git 히스토리 확인 (git log)
- [ ] 중요 문서 보관

---

### Phase 2: 로컬 환경 정리
**목표**: localhost의 모든 Dev_AI 서비스 제거

#### 2.1 실행 중인 프로세스 종료
```bash
# 각 서비스별 종료
- Next.js (포트 3000, 3200) 중지
- FastAPI (포트 4500) 중지
- Redis/PostgreSQL (선택)
```

**담당**: 로컬 개발 환경
**예상 시간**: 5분
**체크리스트**:
- [ ] `lsof -i :3000` 확인 후 kill
- [ ] `lsof -i :3200` 확인 후 kill
- [ ] `lsof -i :4500` 확인 후 kill
- [ ] 포트 정리 확인

#### 2.2 디렉토리 정리
```bash
경로: /Users/hyounmoukshin/GitHub_project/Dev_AI/

삭제 대상:
├── web/                 (486MB) - Next.js
├── api/                 (34MB)  - FastAPI
├── docs/                (344KB) - 문서
├── docker-compose.yml   - 설정
├── web/.env.local       - 환경 변수
├── api/.env             - 환경 변수
└── *.md (선택)          - 문서들
```

**담당**: 로컬 개발 환경
**예상 시간**: 5분
**체크리스트**:
- [ ] 디렉토리 백업 완료 확인
- [ ] `rm -rf web/` 실행
- [ ] `rm -rf api/` 실행
- [ ] `rm -rf docs/` 실행
- [ ] 설정 파일 삭제 확인

#### 2.3 Git 히스토리 관리
**옵션 A: 커밋 히스토리 유지** (권장)
```bash
git add -A
git commit -m "cleanup: Remove Dev_AI project"
git push origin main
```
- 장점: 히스토리 보존, 롤백 가능
- 단점: 저장소 크기 유지

**옵션 B: 커밋 히스토리 삭제** (급진적)
```bash
# 처음부터 다시 시작
git filter-branch --subdirectory-filter docs -- --all
rm -rf .git
git init
```
- 장점: 저장소 크기 감소
- 단점: 히스토리 손실, 복구 불가

**선택**: **옵션 A (권장)** - 히스토리 유지

**체크리스트**:
- [ ] 변경사항 스테이징
- [ ] 커밋 메시지 작성
- [ ] `git push` 실행

---

### Phase 3: 프로덕션 서버 정리
**목표**: 172.237.14.73의 온라인 서비스 안전하게 종료

#### 3.1 사전 알림 & 백업
```bash
서버: 172.237.14.73 (Ubuntu 24.04)
```

**담당**: 서버 관리자
**예상 시간**: 30분
**절차**:
1. 서비스 사용자/관계자 알림
2. 현재 실행 중인 작업 확인 후 대기
3. 데이터 최종 백업
4. 로그 아카이빙

**체크리스트**:
- [ ] 오너 확인: 누가 운영하는가?
- [ ] 사용자 알림: 누가 사용하고 있는가?
- [ ] 데이터 백업: PostgreSQL, Redis
- [ ] 서버 접근 권한 확인

#### 3.2 온라인 서비스 종료
```bash
서버 경로: /home/weruby/Dev_AI/

# 1. 실행 중인 프로세스 종료
$ ps aux | grep "python -m uvicorn" | grep -v grep | awk '{print $2}' | xargs kill -9
$ ps aux | grep "npm run start" | grep -v grep | awk '{print $2}' | xargs kill -9

# 2. Nginx 설정 제거
$ sudo rm /etc/nginx/sites-available/dev-ai
$ sudo rm /etc/nginx/sites-enabled/dev-ai
$ sudo systemctl reload nginx

# 3. 디렉토리 삭제
$ rm -rf /home/weruby/Dev_AI/
```

**담당**: 서버 관리자
**예상 시간**: 15분
**체크리스트**:
- [ ] SSH 접속 (172.237.14.73)
- [ ] 프로세스 확인: `ps aux | grep Dev_AI`
- [ ] 프로세스 종료
- [ ] Nginx 설정 제거
- [ ] 디렉토리 삭제
- [ ] 포트 정리 확인: `lsof -i :3200`, `:4500`
- [ ] 서비스 재시작 확인

---

### Phase 4: 인프라 정리 (선택)
**목표**: Redis, PostgreSQL 정리 (필요시)

#### 옵션 1: 유지 (권장)
- **이유**: 다른 프로젝트에 영향 없음
- **저장소**: 로컬 개발용으로 유지
- **액션**: 없음

#### 옵션 2: 정리
```bash
# Redis 중지
$ redis-cli shutdown

# PostgreSQL 중지
$ pg_ctl stop -D /usr/local/var/postgres

# 데이터 삭제
$ rm -rf /usr/local/var/postgres
```

**선택**: **옵션 1 (유지)** - 로컬 개발용으로 유지

**체크리스트** (옵션 2 선택 시):
- [ ] 데이터 백업 완료
- [ ] 서비스 종료
- [ ] 디렉토리 삭제

---

## 📋 실행 체크리스트

### 로컬 정리 (즉시 실행 가능)
- [ ] **백업**: PostgreSQL/Redis 데이터 덤프
- [ ] **프로세스 중지**: 포트 3000, 3200, 4500 종료
- [ ] **디렉토리 삭제**: web/, api/, docs/
- [ ] **설정 삭제**: .env.local, docker-compose.yml
- [ ] **Git 커밋**: "cleanup: Remove Dev_AI project"
- [ ] **Git 푸시**: `git push origin main`
- [ ] **검증**: ls, ps aux 로 정리 확인

### 서버 정리 (조율 필요)
- [ ] **오너 확인**: 서버 관리자 확인
- [ ] **사용자 알림**: 운영 중단 공지
- [ ] **데이터 백업**: 최종 백업
- [ ] **서비스 종료**: 포트 3200, 4500 종료
- [ ] **Nginx 설정 제거**
- [ ] **디렉토리 삭제**: /home/weruby/Dev_AI/
- [ ] **검증**: 서비스 종료 확인

---

## 🔄 롤백 계획

### 롤백 가능 시점
| 시점 | 가능성 | 방법 |
|------|--------|------|
| 디렉토리 삭제 전 | ✅ 완전 | 백업 복구 |
| Git 커밋 후 | ✅ 부분 | `git revert` |
| 서버 프로세스 중지 후 | ✅ 부분 | 백업에서 재배포 |
| 서버 디렉토리 삭제 후 | ⚠️ 어려움 | 로컬에서 재배포 필요 |

### 긴급 복구 절차
```bash
# 로컬에서 커밋 되돌리기
$ git revert <커밋-해시>

# 백업에서 복구
$ cp -r /backup/Dev_AI_backup /Users/hyounmoukshin/GitHub_project/Dev_AI

# 서버에 재배포
$ cd /home/weruby/Dev_AI
$ git clone https://github.com/seanshin/devAI.git
```

---

## ⚠️ 위험 요소 & 완화 방안

| 위험 | 심각도 | 완화 방안 |
|------|--------|---------|
| 데이터 손실 | 🔴 높음 | 사전 백업 (Phase 1) |
| 온라인 서비스 중단 | 🟡 중간 | 사용자 알림, 타이밍 조율 |
| 잘못된 삭제 | 🔴 높음 | 2단계 확인, 백업 검증 |
| 롤백 불가 | 🟡 중간 | Git 히스토리 유지 (옵션 A) |
| 다른 서비스 영향 | 🟢 낮음 | ✅ 독립적 구조 확인 |

---

## 📅 예상 일정

| Phase | 항목 | 예상 시간 | 담당 | 상태 |
|-------|------|---------|------|------|
| 1 | 백업 & 점검 | 15분 | 로컬 | ⬜ |
| 2.1 | 프로세스 중지 | 5분 | 로컬 | ⬜ |
| 2.2 | 디렉토리 삭제 | 5분 | 로컬 | ⬜ |
| 2.3 | Git 관리 | 5분 | 로컬 | ⬜ |
| **소계** | **로컬 정리** | **30분** | | |
| 3.1 | 서버 알림 & 백업 | 30분 | 서버관리자 | ⬜ |
| 3.2 | 온라인 종료 | 15분 | 서버관리자 | ⬜ |
| **소계** | **서버 정리** | **45분** | | |
| | **전체** | **~75분** | | |

---

## ✅ 완료 기준

### 로컬 정리 완료
- [ ] web/, api/, docs/ 디렉토리 삭제됨
- [ ] 포트 3000, 3200, 4500 사용 중 아님
- [ ] Git 커밋 & 푸시 완료
- [ ] 환경 변수 파일 제거됨

### 서버 정리 완료
- [ ] 172.237.14.73에서 Dev_AI 서비스 중지
- [ ] /home/weruby/Dev_AI/ 디렉토리 삭제
- [ ] Nginx 설정 제거
- [ ] 온라인 http://172.237.14.73/ai/ 404 응답

### 전체 완료
- [ ] 두 위 조건 모두 만족
- [ ] 데이터 백업 보관
- [ ] 롤백 절차 문서화

---

## 📝 참고

### 백업 위치
```bash
# 로컬
~/Backup/Dev_AI_backup_20260513/

# 서버
/home/weruby/backups/Dev_AI_backup_20260513/
```

### 관련 문서
- README.md
- ARCHITECTURE_FINAL.md
- DEPLOYMENT_COMPLETE.md
- WEBSOCKET_FIX_SUMMARY.md

### 연락처
- 로컬 개발: 현재 사용자
- 서버 관리: 172.237.14.73 오너 (확인 필요)

---

**다음 단계**: 이 기획서를 검토 후, Phase 1부터 순차적으로 실행하세요.
