# CRM Fullstack (Frontend + Laravel Backend)

This package contains the original React frontend and a Laravel (12.x) backend wired via `VITE_API_BASE_URL`.

## Quick Start

### Backend
1. cd backend
2. Copy env: `cp .env.example .env` and set DB credentials.
3. Install deps: `composer install`
4. Generate key: `php artisan key:generate`
5. Migrate & seed: `php artisan migrate --seed`
6. Serve API: `php artisan serve` (defaults to http://localhost:8000)

### Frontend
1. cd frontend
2. Ensure `.env.local` contains `VITE_API_BASE_URL=http://localhost:8000/api`
3. Install deps: `npm i`
4. Run dev server: `npm run dev`

## Auth (Sanctum)
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login` -> returns `{ token }`
- Store token in `localStorage.setItem('token', token)` to authenticate requests.

> Temporariamente é possível desativar a proteção Sanctum definiando `DISABLE_API_AUTH=true` no `.env`.  
> Quando quiser reativar, volte o valor para `false` e os endpoints voltarão a exigir token.

## Endpoints (prefix /api)
- Users: GET/SHOW/UPDATE/DELETE `/api/users`
- Contacts: CRUD `/api/contacts`
- Lawsuits: CRUD `/api/lawsuits`, PUT `/api/lawsuits/{id}/kanban`
- Tasks: CRUD `/api/tasks`, PUT `/api/tasks/{id}/status`
- Calendar: CRUD `/api/calendar-events`
- Transactions: CRUD `/api/transactions`
- Dashboard: `/api/dashboard/summary`, `/api/management/agility`, `/api/management/productivity`, `/api/management/office`
- Gamification: `/api/gamification/status`, `/api/gamification/ranking`
