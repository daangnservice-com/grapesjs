FROM node:20-alpine AS runner

WORKDIR /app

# SQLite 및 네이티브 모듈 빌드 종속성, 헬스체크용 curl 설치
RUN apk add --no-cache python3 make g++ curl

# 의존성 파일 복사 및 프로덕션 설치
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --prod

# 앱 소스코드 복사
COPY app ./app
COPY data ./data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "app/server.js"]
