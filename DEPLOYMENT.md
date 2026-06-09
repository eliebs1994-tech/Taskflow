# TaskFlow — Deployment Guide

## What's included
- **Backend**: Node.js + Express + SQLite (better-sqlite3) + Socket.io
- **Frontend**: Vanilla JS SPA, PWA-ready, English + Arabic (RTL)
- **Features**: Tasks, Departments, Time tracking, Reports, Gantt, Notifications, AI Assistant, AI Feature Builder

---

## Quick start (local / internal server)

### 1. Install Node.js
Download from https://nodejs.org (version 18 or higher)

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Start the server
```bash
npm start
```

### 4. Open in browser
```
http://localhost:3001
```

### Default login
- Username: `admin`
- Password: `admin123`
⚠️ Change this immediately after first login via Settings.

---

## Deploy to the cloud (recommended for remote access)

### Option A — Railway (easiest, free tier available)
1. Go to https://railway.app and sign up
2. Click "New Project" → "Deploy from GitHub"
3. Upload this folder to a GitHub repo first
4. Set root directory to `backend`
5. Railway auto-detects Node.js and deploys
6. Your app gets a public URL like `https://taskflow-xxx.railway.app`

### Option B — Render (free tier)
1. Go to https://render.com and sign up
2. New → Web Service → connect your GitHub repo
3. Root directory: `backend`, Build command: `npm install`, Start: `npm start`
4. Free tier sleeps after 15min inactivity (upgrade for always-on)

### Option C — VPS (DigitalOcean, Hetzner, etc.)
```bash
# On your server
git clone <your-repo>
cd taskflow/backend
npm install
npm install -g pm2
pm2 start server.js --name taskflow
pm2 save
pm2 startup
```
Then point your domain to the server IP using an A record.

---

## Environment variables (optional)
Create a `.env` file in the `backend` folder:
```
PORT=3001
JWT_SECRET=your_very_long_random_secret_here
```
Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Install as mobile app (PWA)
1. Open the app URL in Chrome (Android) or Safari (iOS)
2. Android: tap the "Add to home screen" banner or Menu → Add to home screen
3. iOS: tap Share → Add to Home Screen
4. The app installs like a native app with your TaskFlow icon

---

## User roles
| Role | Can do |
|------|--------|
| Admin | Everything: create users, delete tasks, manage departments, AI Studio |
| Manager | Create/edit/delete tasks in their department, view all reports |
| Member | View and update their assigned tasks, log time |

---

## Adding team members
Only admins can create accounts. Go to **Team members** → **Add member**.

---

## AI features
Each user adds their own Anthropic API key in **Settings → Anthropic API key**.
- All roles: AI assistant (scoped to their data)
- Admin only: AI Feature Builder (describe a new feature, get implementation code)

Get an API key at: https://console.anthropic.com

---

## Database
Data is stored in `taskflow.db` (SQLite file) in the project root.
Back it up regularly by copying this file. No external database needed.

---

## File structure
```
taskflow/
├── backend/
│   ├── server.js          # Main server
│   ├── package.json
│   ├── db/
│   │   └── database.js    # Schema + seed data
│   ├── middleware/
│   │   └── auth.js        # JWT auth
│   └── routes/
│       ├── auth.js        # Login, register, profile
│       ├── tasks.js       # Task CRUD
│       ├── combined.js    # Depts, users, time, notifs, comments
│       └── *.js           # Route stubs
├── frontend/
│   └── public/
│       ├── index.html     # App shell
│       ├── app.js         # Full SPA
│       ├── manifest.json  # PWA manifest
│       └── sw.js          # Service worker
└── DEPLOYMENT.md          # This file
```

---

## Support & extending
The AI Feature Builder (admin only) can help you add new features.
For questions, use the AI assistant inside the app.
