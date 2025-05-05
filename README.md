# 🧠 Users API - NestJS + TypeORM + MySQL + Docker

Projeto para avaliação AB-InBev (backend)

## Pré-requisitos

- Docker e Docker Compose instalados
- Npm & Node.js v22 instalados

---

## Comandos

```bash
npm install
cp .env.example .env
docker-compose up -d
npm run migration:run
npm run start:dev # start server at 3001 default port
```

Tests: ``npm run test``
