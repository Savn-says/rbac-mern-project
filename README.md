# RBAC MERN Application

Role-Based Access Control (RBAC) demo built with the MERN stack. It implements fine‑grained authorization across API and UI for three roles: Admin, Editor, and Viewer.

## Highlights
- Authentication: short‑lived access token (JWT) + httpOnly refresh token (rotation & reuse detection)
- Authorization: route permissions + ownership checks (Editors can modify only their content; Admins can manage all)
- Data scoping: Editor can filter to their own posts; default reads return all posts
- UI guarding: role‑aware routes, disabled actions, and conditional controls
- Seeded demo data: Admin/Editor/Viewer users and sample posts
- Dockerized dev: API, MongoDB, and Frontend via Docker Compose

## Tech Stack
- Frontend: React, Vite, React Router, Bootstrap (CDN)
- Backend: Node.js, Express, Helmet, express-validator, express-rate-limit
- Database: MongoDB (Docker/Atlas)
- Auth: jsonwebtoken, cookie-parser, bcryptjs

## Repository Structure
```
rbac-mern-project/
├── backend/
│   ├── server.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── permissions.js
│   ├── models/
│   │   ├── Post.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── posts.js
│   │   └── users.js
│   └── seed.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── index.html
└── docker-compose.yml
```

## Quick Start (Docker)
Requirements: Docker Desktop

```bash
cd rbac-mern-project
docker compose up -d --build
```

Services
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- MongoDB: localhost:27017 (container `mongo`)

Seeded Accounts
- Admin: admin@example.com / admin123
- Editor: editor@example.com / editor123
- Viewer: viewer@example.com / viewer123

## Local Development (without Docker)
Backend
```bash
cd backend
npm install
export MONGODB_URI="mongodb://localhost:27017/rbac-db"   # PowerShell: setx MONGODB_URI "..." then open new shell
export JWT_SECRET="a_strong_secret"                       # PowerShell: setx JWT_SECRET "..."
node seed.js
npm run dev
```

Frontend
```bash
cd frontend
npm install
# Ensure API base URL points to your backend
# Vite: import.meta.env.VITE_API_URL
npm run dev
```

## API Overview
Auth
- POST `/api/auth/login` → returns `{ token }` and sets httpOnly cookie `rt`
- POST `/api/auth/refresh` → rotates refresh, returns new `{ token }`
- POST `/api/auth/logout` → clears refresh cookie

Posts
- GET `/api/posts` → list all posts (Editor can pass `?mine=true` for own)
- POST `/api/posts` → create (Editor/Admin)
- PUT `/api/posts/:id` → update own (Editor) or any (Admin)
- DELETE `/api/posts/:id` → delete own (Editor) or any (Admin)

Users (Admin)
- GET `/api/users` → list users
- PATCH `/api/users/:id/role` → change role

## Security Notes
- Helmet, CORS with credentials, input validation, rate limiting on login
- Passwords hashed with bcryptjs
- Refresh token rotation with jti; reuse detection revokes session

## Deployment (Free Tier)-->(future improvements)
- Database: MongoDB Atlas (M0)
- API: Render Free Web Service (Node)
  - Env: `MONGODB_URI`, `JWT_SECRET`
- Frontend: Vercel (React/Vite)
  - Env: `VITE_API_URL` = your Render API URL

## License
MIT
