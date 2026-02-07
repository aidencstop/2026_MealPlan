# 유저 맞춤 주간 식단 추천 웹앱

AI 기반으로 사용자의 건강 상태, 식단 목적, 알러지 등을 고려하여 주간 식단을 추천하는 웹 애플리케이션입니다.

## 주요 기능

- 🍽️ **주간 식단 추천**: 일요일~토요일 아침/점심/저녁 식단 자동 생성
- 📊 **식단 평가**: 지난주 섭취 기록 분석 및 개선점 제시
- 👤 **맞춤형 추천**: 성별, 나이, 식단 목적, 알러지, 질병 고려
- 📝 **섭취 기록 관리**: 주별 식단 기록 및 히스토리 조회

## 기술 스택

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Axios

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- JWT 인증
- OpenAI GPT-4 API

## 설치 및 실행

### 사전 요구사항
- Node.js 18+ 설치
- PostgreSQL 설치 및 실행

### 1. 의존성 설치
```bash
npm run install:all
```

### 2. 데이터베이스 설정
```bash
# PostgreSQL에 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE mealplan_db;

# 스키마 적용
psql -U postgres -d mealplan_db -f database/schema.sql
```

### 3. 환경변수 설정
`backend/.env` 파일 생성:
```
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/mealplan_db
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
```

### 4. 개발 서버 실행
```bash
# 터미널 1 - Backend
npm run dev:backend

# 터미널 2 - Frontend
npm run dev:frontend
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

## 프로젝트 구조

```
2026_MealPlan/
├── frontend/           # React 프론트엔드
│   ├── src/
│   │   ├── components/ # 재사용 컴포넌트
│   │   ├── pages/      # 페이지 컴포넌트
│   │   ├── services/   # API 통신
│   │   └── utils/      # 유틸리티 함수
├── backend/            # Express 백엔드
│   ├── src/
│   │   ├── routes/     # API 라우트
│   │   ├── controllers/# 컨트롤러
│   │   ├── services/   # 비즈니스 로직
│   │   ├── db/         # 데이터베이스 연결
│   │   └── utils/      # 유틸리티 함수
└── database/           # SQL 스키마
```

## 라이센스
MIT
