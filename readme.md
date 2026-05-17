# Event Planner Backend

## Overview
Express + TypeScript backend for the Event Planner application.  
It provides authentication, event APIs, validation, and authorization with Prisma + PostgreSQL.

## Live API
- Production API base URL: https://event-backend-eiff.onrender.com/api

## Frontend Client
- Production frontend URL: https://event-frontend-taupe.vercel.app/

## API Routes
### Auth
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Events
- `GET /events`
- `GET /events/:id`
- `POST /events` (auth required)
- `PUT /events/:id` (auth required, owner only)
- `DELETE /events/:id` (auth required, owner only)

## Tech Stack
- Node.js + Express + TypeScript
- Prisma + PostgreSQL (Supabase)
- JWT in `httpOnly` cookie
- Zod validation
- CORS + rate limiting

## Local Setup
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create `.env` in `backend/`:
   ```env
   PORT=4000
   DATABASE_URL=your_database_url
   DIRECT_URL=your_direct_database_url
   JWT_SECRET=your_secret
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```
3. Generate Prisma client and run migrations:
   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev --name init
   ```
4. Start development server:
   ```bash
   pnpm run dev
   ```

## Scripts
- `pnpm run dev` - run backend in watch mode
- `pnpm run build` - generate Prisma client and compile TypeScript
- `pnpm run start` - apply migrations and start production server

## Quick API Check
```bash
curl https://event-backend-eiff.onrender.com/api/events
```
