# 🧠 Users API - NestJS + TypeORM + MySQL + Docker

API RESTful para gerenciamento de usuários utilizando NestJS, TypeORM e banco de dados MySQL. 
O projeto também implementa cache com Redis e testes unitários com Jest.

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

```

Tests: ``npm run test``