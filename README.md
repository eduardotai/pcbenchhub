# PC BenchHub - PC Benchmark Platform

A full-stack MVP for a PC benchmark community platform where users can submit, view, search, compare, and discuss PC benchmarks.

## Features

- **User Authentication**: Register, login, JWT-based auth, email verification
- **Benchmark Submission**: Multi-step wizard for beginners, quick mode for advanced users
- **Benchmark Dashboard**: Searchable list with filters (category, tool, user level)
- **Comparison Tool**: Compare up to 5 benchmarks side-by-side with charts
- **Leaderboard**: Top scores by category
- **Community Features**: Comments with profanity filter
- **Admin Dashboard**: Moderate flagged content, manage users
- **i18n Support**: English and Portuguese
- **Dark Theme**: Hardware-inspired dark UI

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Chart.js, React Router, i18next
- **Backend**: Node.js, Express, JWT, bcrypt
- **Database**: SQLite (better-sqlite3)
- **Deployment**: Vercel (frontend), Render (backend)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm run seed    # Creates sample data
npm start       # Runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev    # Runs on http://localhost:3000
```

## Test Accounts

After running the seed script:

| Email | Password | Role |
|-------|----------|------|
| admin@pcbenchhub.com | admin123 | Admin |
| alex@example.com | builder123 | Beginner |
| jordan@example.com | enthusiast123 | Intermediate |
| riley@example.com | overclock123 | Advanced |

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile

### Benchmarks
- `GET /api/benchmarks` - List benchmarks (with filters)
- `POST /api/benchmarks` - Submit benchmark
- `GET /api/benchmarks/:id` - Get benchmark
- `GET /api/benchmarks/compare?ids=1,2,3` - Compare benchmarks
- `GET /api/benchmarks/leaderboard` - Get leaderboard
- `POST /api/benchmarks/:id/flag` - Flag benchmark

### Comments
- `GET /api/comments/:benchmarkId` - Get comments
- `POST /api/comments` - Add comment
- `DELETE /api/comments/:id` - Delete comment

### Admin
- `GET /api/admin/flags` - Get flagged benchmarks
- `GET /api/admin/users` - Get all users
- `POST /api/admin/benchmark/:id/remove` - Remove benchmark
- `POST /api/admin/user/:id/ban` - Ban user

## Project Structure

```
pcbenchhub/
├── backend/
│   ├── config/         # Database config
│   ├── middleware/     # Auth, validation
│   ├── models/         # User, Benchmark, Comment
│   ├── routes/         # API routes
│   ├── utils/          # Rate limiter, seed data
│   ├── server.js       # Express app
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/ # Layout, cards
│   │   ├── context/    # Auth context
│   │   ├── i18n/       # Translations
│   │   ├── pages/      # All pages
│   │   ├── services/   # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
```

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Build command: `npm run build`
4. Output directory: `dist`

### Backend (Render)

1. Push to GitHub
2. Import project in Render
3. Use the `render.yaml` or configure manually:
   - Build command: `npm install`
   - Start command: `node server.js`

## Business Rules Implemented

- Email verification required for submissions
- 5 submissions per day limit (rate limiting)
- Auto-flag implausible benchmark scores
- 3 flags = user ban
- Profanity filter on comments
- No anonymous posts

## Future Improvements

- AI-powered benchmark insights
- Hardware compatibility suggestions
- Price tracking
- Export to PDF reports
- Social sharing
- Achievement badges
