# 🚀 Quick Deployment Guide - 9DTTT Platform

## Step-by-Step Deployment Instructions

### Prerequisites
- Render account (for backend)
- Vercel account (for frontend)
- Infura account (free tier) - Get at https://infura.io
- Domain: d9ttt.com (DNS pointed to Vercel)

---

## Part 1: Deploy Backend to Render

### 1. Create New Web Service on Render
```
Name: 9dttt-backend
Region: Oregon (US West) or closest to your users
Branch: main
Root Directory: . (leave empty or set to repository root)
```

### 2. Build & Start Commands
```
Build Command: npm install
Start Command: node server.js
```

### 3. Environment Variables (CRITICAL!)

Click "Advanced" → "Add Environment Variable" and add these:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `3000` | Required |
| `JWT_SECRET` | `<generate-random>` | **CRITICAL** - see below |
| `INFURA_KEY` | `<your-infura-key>` | Get from infura.io |
| `ALCHEMY_API_KEY` | `<optional>` | Only if using Alchemy |
| `REDIS_URL` | `<optional>` | For production Redis |

#### Generate JWT_SECRET
Run this in terminal to generate a secure random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste as JWT_SECRET value.

#### Get Infura Key
1. Go to https://infura.io
2. Sign up for free account
3. Create new project
4. Copy the Project ID
5. Paste as INFURA_KEY value

### 4. Deploy Backend
- Click "Create Web Service"
- Wait for deployment (2-5 minutes)
- Verify deployment at: `https://ninedttt.onrender.com/ping`

**Expected response:**
```json
{
  "status": "ok",
  "message": "9DTTT Game Server is running"
}
```

---

## Part 2: Deploy Frontend to Vercel

### 1. Import Repository to Vercel
```
Framework Preset: Other
Root Directory: . (repository root)
Build Command: echo 'No build needed - static files only'
Output Directory: Public
Install Command: npm install (or skip)
```

### 2. Domain Configuration
In Vercel project settings:
```
Custom Domains:
- d9ttt.com (primary)
- www.d9ttt.com (redirect to primary)
```

### 3. Verify vercel.json
The file already has these rewrites configured:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://ninedttt.onrender.com/api/:path*"
    },
    {
      "source": "/socket.io/:path*",
      "destination": "https://ninedttt.onrender.com/socket.io/:path*"
    }
  ]
}
```

---

## Part 3: Test Deployment

### Test 1: Backend Health
```bash
curl https://ninedttt.onrender.com/ping
```

### Test 2: API Config
```bash
curl https://d9ttt.com/api/config
```

### Test 3: Open Website
Visit: https://d9ttt.com
- Games should load
- No console errors

### Test 4: Socket.io
1. Open any game
2. Check browser console for:
   - "Connecting to Socket.io server"
   - "Socket connected"

---

## Environment File

Your `.env` should contain:

```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=<64-char-hex-string>
INFURA_KEY=<your-infura-project-id>
```

---

## Troubleshooting

**Socket.io fails:** Check vercel.json rewrites
**CORS errors:** Verify domains in server.js
**JWT errors:** Ensure JWT_SECRET is set in Render
**Infura rate limit:** Set INFURA_KEY in Render

---

**Deployment Time:** ~15 minutes
**Cost:** Free (using free tiers)
