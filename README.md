# TaskBoard — Full Stack Developer Assignment

A clean, full-stack task management application.

**Stack:** Next.js 14 · TypeScript · Prisma · SQLite · NextAuth.js · Tailwind CSS

---

## Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Framework  | Next.js 14 (App Router)                     |
| Language   | TypeScript (strict)                         |
| Database   | SQLite via Prisma ORM                       |
| Auth       | NextAuth.js v4 — JWT + CredentialsProvider  |
| Styling    | Tailwind CSS + custom CSS design system     |
| Hashing    | bcryptjs (12 salt rounds)                   |

---

## Authentication Flow

```
SIGNUP
  POST /api/auth/signup
    → validate email, password length
    → check uniqueness (prisma.user.findUnique)
    → bcrypt.hash(password, 12)
    → prisma.user.create()
    → redirect /login

LOGIN
  NextAuth CredentialsProvider
    → prisma.user.findUnique({ email })
    → bcrypt.compare(plain, hash)
    → JWT issued: { id, email, name }
    → session.user.id available server-side

PROTECTED ROUTES
  middleware.ts intercepts /dashboard/*
  → NextAuth verifies JWT cookie
  → unauthenticated → redirect /login
```

---

## Database Schema

```
User
  id        String   PK (cuid)
  name      String?
  email     String   unique
  password  String   (bcrypt hash — never plain)
  createdAt DateTime
  tasks     Task[]   one-to-many

Task
  id        String   PK (cuid)
  title     String   (max 200 chars)
  status    String   "TODO" | "IN_PROGRESS" | "DONE"
  createdAt DateTime
  updatedAt DateTime
  userId    String   FK → User.id (cascade delete)

Note: SQLite does not support native enums.
      Status is a String with server-side validation.
```

---

## API Endpoints

| Method | Route                  | Auth | Description          |
|--------|------------------------|------|----------------------|
| POST   | /api/auth/signup       | No   | Register new user    |
| POST   | /api/auth/[...nextauth]| No   | NextAuth signin      |
| GET    | /api/tasks             | JWT  | List user's tasks    |
| POST   | /api/tasks             | JWT  | Create task          |
| PATCH  | /api/tasks/:id         | JWT  | Update task status   |

---

## Project Structure

```
taskboard/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts   ← NextAuth handler
│   │   │   └── signup/route.ts          ← registration
│   │   └── tasks/
│   │       ├── route.ts                 ← GET + POST
│   │       └── [id]/route.ts            ← PATCH
│   ├── dashboard/page.tsx               ← kanban board
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── layout.tsx
│   ├── page.tsx                         ← redirect
│   └── globals.css
├── components/AuthProvider.tsx
├── lib/
│   ├── auth.ts                          ← NextAuth config
│   └── prisma.ts                        ← singleton client
├── prisma/schema.prisma
├── types/next-auth.d.ts
└── middleware.ts                        ← route protection
```

---

## Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env
#   Edit NEXTAUTH_SECRET to any random string

# 3. Create database + tables
npx prisma db push

# 4. Start dev server
npm run dev
```

Open **http://localhost:3000** → signup → login → use the board.

---

## Features

- Signup / Login with bcrypt-hashed passwords
- JWT sessions via NextAuth
- Protected routes (middleware)
- Create tasks with title + initial status
- Kanban board: To Do / In Progress / Done columns
- Quick "Start / Complete / Reset" action button per card
- Status dropdown for direct status change
- Stats row + animated progress bar
- Shimmer skeleton loading state
- Empty states per column
- Toast notifications for all actions
- Password strength indicator (signup)
- Responsive layout (mobile + desktop)
- Animated ambient background, fade-up entrances, pulse dots
