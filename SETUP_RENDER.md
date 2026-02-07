# 🚀 Quick Render Setup Guide

## Problem

The backend URL `https://9dttt.onrender.com` doesn't exist yet. You need to create it!

---

## Setup Steps

### 1. Go to Render Dashboard

Visit: <https://dashboard.render.com>

### 2. Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub account if not already connected
3. Select repository: **9dtictactoe/9dttt**
4. Click **"Connect"**

### 3. Configure Service

Fill in these settings:

```text
Name: 9dttt-backend
Region: Oregon (US West)
Branch: main
Runtime: Node
Root Directory: (leave empty)
Build Command: npm install
Start Command: node server.js
```

### 4. Set Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these:

```env
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app.vercel.app
JWT_SECRET=your-random-secret-here
```

**Important**: Replace `https://your-app.vercel.app` with your actual Vercel URL!

### 5. Choose Plan

Select **"Free"** plan

### 6. Create Service

Click **"Create Web Service"**

Wait 2-3 minutes for deployment...

---

## Verify It Works

Once deployed, test these URLs:

```bash
# Health check
curl https://your-app.onrender.com/api/health

# Expected response:
{"status":"healthy","timestamp":"...","uptime":123}
```

---

## Get Your Render URL

After deployment, your URL will be:

- Either: `https://9dttt-backend.onrender.com`
- Or: `https://[custom-name].onrender.com`

---

## Update vercel.json

Once you have your actual Render URL, update [vercel.json](vercel.json):

```json
"rewrites": [
  {
    "source": "/api/:path*",
    "destination": "https://YOUR-ACTUAL-RENDER-URL.onrender.com/api/:path*"
  },
  {
    "source": "/socket.io/:path*",
    "destination": "https://YOUR-ACTUAL-RENDER-URL.onrender.com/socket.io/:path*"
  }
]
```

Then commit and push:

```bash
git add vercel.json
git commit -m "Update Render backend URL"
git push origin main
```

---

## Alternative: Use Blueprint

Render can auto-create the service from `render.yaml`:

1. Go to <https://dashboard.render.com/blueprints>
2. Click **"New Blueprint Instance"**
3. Connect to **9dtictactoe/9dttt**
4. Click **"Apply"**

This automatically sets everything up! ✨

---

## Troubleshooting

### Service URL Changed?

If Render assigned a different URL, update these:

1. `vercel.json` - update `rewrites` destinations
2. `QUICK_REFERENCE.md` - update documentation
3. Commit and push changes

### CORS Errors?

Update `FRONTEND_URL` environment variable in Render to match your Vercel URL

### Still Not Working?

Check Render logs:

1. Go to Render Dashboard
2. Click your service
3. Click **"Logs"** tab
4. Look for errors

---

## Need Help?

See [DEPLOYMENT_SPLIT.md](DEPLOYMENT_SPLIT.md) for full deployment guide!
