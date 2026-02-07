# 9DTTT Platform - Deployment Guide

## 🚀 Quick Deploy to Vercel

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/9dttt)

### Manual Deploy

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **For Production**
```bash
vercel --prod
```

## 📦 Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. **Clone & Install**
```bash
git clone https://github.com/yourusername/9dttt.git
cd 9dttt
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your values
```

3. **Run Development Server**
```bash
npm run dev
```

4. **Open Browser**
```
http://localhost:3000
```

## 🔧 Configuration

### Environment Variables

Required for production:
- `NODE_ENV` - Set to "production"
- `JWT_SECRET` - Secure random string
- `MONGODB_URI` - MongoDB connection string (optional)

Optional:
- `FIREBASE_PROJECT_ID` - For Google/Apple login
- `REDIS_URL` - For session storage
- `ALCHEMY_API_KEY` - For Web3 features

### Vercel Environment Variables

Add in Vercel Dashboard → Project → Settings → Environment Variables

## 📊 Database Setup

### MongoDB (Recommended for Production)

```javascript
// Install
npm install mongoose

// Connect (already in server.js)
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
```

### Redis (Optional - for sessions)

```bash
# Install
npm install redis

# Connect
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });
```

## 🎮 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/leaderboard` - Get leaderboard
- `POST /api/leaderboard` - Submit score
- `POST /api/auth/login` - Login/Register

### Game-Specific
- `GET /api/crypto-quest/progress?userId=xxx` - Get progress
- `POST /api/crypto-quest/progress` - Save progress

## 🔒 Security

Production checklist:
- [ ] Set strong JWT_SECRET
- [ ] Enable CORS restrictions
- [ ] Add rate limiting
- [ ] Use HTTPS only
- [ ] Hash passwords with bcrypt
- [ ] Validate all inputs
- [ ] Add CSRF protection
- [ ] Monitor API usage

## 📈 Monitoring

### Vercel Analytics
Automatically enabled - see dashboard

### Custom Monitoring
Add to your API routes:
```javascript
console.log('Request:', req.method, req.url);
console.error('Error:', error);
```

## 🎯 Performance

Optimizations applied:
- ✅ Static asset caching
- ✅ Gzip compression
- ✅ CDN delivery via Vercel
- ✅ Edge functions
- ✅ Lazy loading

## 🔄 Updates

Deploy updates:
```bash
git push  # Auto-deploys if connected to GitHub
# OR
vercel --prod
```

## 📱 Custom Domain

1. Go to Vercel Dashboard → Domains
2. Add your domain
3. Update DNS records as shown
4. Enable HTTPS (automatic)

## 🐛 Troubleshooting

### Build Fails
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache
rm -rf node_modules package-lock.json
npm install
```

### API Errors
- Check environment variables are set
- Review Vercel function logs
- Ensure CORS is configured

### Database Issues
- Verify MongoDB connection string
- Check IP whitelist in MongoDB Atlas
- Test connection locally first

## 📞 Support

- GitHub Issues: [Your Repo]
- Vercel Docs: https://vercel.com/docs
- Discord: [Your Server]

## 🎉 Success!

Your platform is now live! Features:
- ✅ 31 games deployed
- ✅ Full authentication system
- ✅ Real-time leaderboards
- ✅ Progress saving
- ✅ Crypto Quest Academy with 25 lessons
- ✅ Multiplayer support ready
- ✅ Auto-scaling
- ✅ Global CDN

Visit your site at: `https://your-project.vercel.app`
