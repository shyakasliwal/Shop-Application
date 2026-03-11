# Productr - MERN OTP Authentication

## Project structure

- **`backend/`** – Node.js + Express + MongoDB API (OTP send/verify, JWT)
- **`frontend/`** – React + Vite + Tailwind UI (login with OTP)
- **`public/`** – Root static assets (legacy; frontend uses `frontend/public/`)

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env` (copy from `.env.example`):

```
MONGODB_URI=mongodb+srv://...
SMTP_EMAIL=your@gmail.com
SMTP_PASSWORD=your_gmail_app_password
JWT_SECRET=your_secret
PORT=5000
```

**Note:** Use a Gmail App Password (not your normal password). Enable 2FA and create one at https://myaccount.google.com/apppasswords

### 2. Frontend

```bash
cd frontend
npm install
```

## Run

**Terminal 1 – Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
```

- Frontend: http://localhost:5173 (or 5174 if 5173 is in use)
- Backend API: http://localhost:5000

## Flow

1. Enter email → click **Send OTP** → OTP sent via Gmail
2. Enter 6-digit OTP → click **Verify OTP** → JWT stored in `localStorage`
