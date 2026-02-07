# 데이터베이스 설정

## PostgreSQL 설치

### Windows
1. https://www.postgresql.org/download/windows/ 에서 다운로드
2. 설치 시 비밀번호 설정 (예: postgres)
3. Port는 기본값 5432 사용

## 데이터베이스 생성 및 스키마 적용

```bash
# PostgreSQL에 접속 (비밀번호 입력)
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE mealplan_db;

# 접속 종료
\q

# 스키마 적용
psql -U postgres -d mealplan_db -f schema.sql
```

## 연결 확인

```bash
# 데이터베이스 접속
psql -U postgres -d mealplan_db

# 테이블 목록 확인
\dt

# 테이블 구조 확인
\d users
\d health_conditions
\d weekly_intake_records
\d weekly_meal_plans
```

## 데이터베이스 구조

### users
사용자 기본 정보 (username, password, 성별, 나이, 식단 목적 등)

### health_conditions
사용자별 질병 및 알러지 정보

### weekly_intake_records
주간 섭취 기록 및 평가 (Macro, 잘된점, 아쉬운점, 개선법)

### weekly_meal_plans
AI가 생성한 주간 추천 식단
