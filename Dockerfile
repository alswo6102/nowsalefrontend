# =================================================================
# 1. 빌드 스테이지: Node.js 환경에서 React 앱을 빌드합니다.
# =================================================================
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일 먼저 복사 (빌드 속도 최적화)
COPY package.json package-lock.json* ./

# 의존성 설치 (프로덕션용만)
# package-lock.json이 있으면 npm ci를 사용해 더 빠르고 안정적으로 설치
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# 전체 소스 코드 복사
COPY . .

# React 앱 빌드
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# =================================================================
# 2. 프로덕션 스테이지: 가벼운 Nginx 웹서버에 빌드 결과물만 올립니다.
# =================================================================
FROM nginx:stable-alpine

# 빌드 스테이지에서 생성된 /app/build 폴더의 내용물을
# Nginx의 기본 웹 루트 폴더로 복사합니다.
COPY --from=builder /app/build /usr/share/nginx/html

# React Router를 사용할 경우, 404 에러를 방지하기 위한 설정 파일을 복사합니다.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

# 컨테이너 시작 시 Nginx를 실행합니다.
CMD ["nginx", "-g", "daemon off;"]
