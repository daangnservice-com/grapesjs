FROM node:20-slim AS runner

WORKDIR /app

# SQLite 및 네이티브 모듈 빌드 종속성, 헬스체크용 curl 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ curl \
    && rm -rf /var/lib/apt/lists/*

# 의존성 파일 복사 및 프로덕션 설치
COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps

# 앱 소스코드 복사
COPY app ./app
COPY data ./data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "app/server.js"]
