# Troubleshooting Guide

## Google OAuth "Still Doesn't Work"

If you're seeing the Google OAuth URL but login isn't working, here's how to diagnose and fix it:

### Step 1: Check What Error You're Seeing

Open your browser's Developer Console (F12) and look for error messages when clicking "Sign in with Google".

#### Common Errors:

**Error: `auth/configuration-not-found`**
```
Solution: Enable Google Sign-In in Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project
3. Navigate to: Authentication → Sign-in method
4. Click Google provider → Enable → Save
```

**Error: `auth/unauthorized-domain`**
```
Solution: Add your domain to authorized domains
1. Firebase Console → Authentication → Settings
2. Authorized domains section
3. Add your domain (e.g., d9ttt.com, www.d9ttt.com)
4. For local testing, add "localhost"
```

**Error: `auth/popup-blocked`**
```
Solution: Allow popups in your browser
1. Look for popup blocker icon in address bar
2. Click and allow popups for this site
3. Try logging in again
```

**Error: `Invalid token` or `Token verification failed`**
```
Solution: Check environment variables on server
1. Verify FIREBASE_PROJECT_ID is set correctly
2. Ensure it matches your Firebase Console project
3. Restart your server after changing environment variables
```

### Step 2: Verify Firebase Configuration

Check if Firebase is properly configured by visiting:
```
https://your-domain.com/api/auth/firebase/status
```

**Good Response (Firebase working):**
```json
{
  "success": true,
  "available": true,
  "providers": [
    {"id": "google.com", "name": "Google", ...}
  ],
  "config": {
    "apiKey": "AIza...",
    "projectId": "your-project-id",
    ...
  }
}
```

**Bad Response (Firebase not configured):**
```json
{
  "success": true,
  "available": false,
  "providers": [],
  "config": null
}
```

If you see `"available": false`, set these environment variables:
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
# ... etc
```

### Step 3: Check Environment Variables

On your hosting platform (Render, Vercel, etc.):

1. Go to your app's settings
2. Find "Environment Variables" section
3. Verify these are set:
   ```
   FIREBASE_PROJECT_ID=xxxxx
   FIREBASE_API_KEY=xxxxx
   FIREBASE_AUTH_DOMAIN=xxxxx.firebaseapp.com
   ```
4. Save and **redeploy** if you made changes

### Step 4: Test Locally

If it works locally but not in production:

1. **Check production environment variables** - they might be missing or incorrect
2. **Check authorized domains** - production domain must be in Firebase authorized domains
3. **Check OAuth consent screen** - must be configured in Google Cloud Console
4. **Check redirect URIs** - must match your production domain

### Step 5: Alternative Login Methods

While troubleshooting Google OAuth, your users can still login with:

✅ **Email/Password** - No external dependencies, works immediately
✅ **Guest Mode** - Instant access, no configuration needed
✅ **Wallet Login** - MetaMask, Phantom, XUMM (if Web3 is enabled)

## FAQ

### Q: Is my API key exposed in the OAuth URL safe?

**A: Yes, completely safe!** 

The client ID you see in OAuth URLs is a **public identifier**, not a secret. It's designed to be visible and is required by the OAuth protocol. 

For a detailed explanation, see: [OAUTH_SECURITY.md](/OAUTH_SECURITY.md)

### Q: Why does the OAuth URL look so complex?

**A: That's normal for OAuth!**

The URL contains:
- Client ID (public)
- Redirect URI (public)
- State parameter (one-time CSRF protection token)
- Scopes (what permissions you're requesting)

All of these are meant to be visible. The security comes from:
- Authorized redirect URIs (only your domains work)
- Backend token verification (server validates everything)
- Client Secret (stays on server, never exposed)

### Q: Should I hide my Firebase API key?

**A: No!** 

Firebase API keys are public by design. From Firebase's own documentation:

> "Unlike how API keys are typically used, API keys for Firebase services are not used to control access to backend resources; that can only be done with Firebase Security Rules."

Security comes from:
- Firebase Security Rules
- Authorized domains
- Backend verification

See: https://firebase.google.com/docs/projects/api-keys

### Q: Can someone steal my users' accounts with the client ID?

**A: No.**

They would need:
1. Your Client Secret (only on your server)
2. Access to your Firebase Console (to add redirect URIs)
3. Access to your server (to intercept authorization codes)

None of these are possible with just the client ID.

### Q: What should I actually keep secret?

**Keep these secret (never commit to git):**
- ❌ JWT_SECRET
- ❌ FIREBASE_PRIVATE_KEY (if using Firebase Admin SDK)
- ❌ Database passwords
- ❌ OAuth Client Secrets

**These are public (safe in client code):**
- ✅ Firebase API Key
- ✅ Firebase Project ID
- ✅ OAuth Client ID
- ✅ Firebase App ID

## Quick Fix Checklist

If Google OAuth isn't working, work through this list:

- [ ] Enable Google provider in Firebase Console
- [ ] Add your domain to Firebase authorized domains
- [ ] Set environment variables on hosting platform
- [ ] Restart/redeploy your application
- [ ] Clear browser cache and try again
- [ ] Check browser console for specific error codes
- [ ] Verify OAuth consent screen is configured

## Still Need Help?

1. **Check browser console** - Look for specific error codes
2. **Check server logs** - Look for token verification errors
3. **Test with different browser** - Rules out browser-specific issues
4. **Try alternative login** - Use email/password to verify server is working
5. **Review Firebase Console** - Make sure all settings are correct

## Working Examples

After fixing Firebase configuration, your login should work like this:

1. User clicks "Sign in with Google"
2. Popup opens to accounts.google.com
3. User selects/logs into their Google account
4. Google redirects back to your app
5. Your server verifies the token
6. User is logged in

The entire flow should take 2-5 seconds.

## Related Documentation

- [OAUTH_SECURITY.md](./OAUTH_SECURITY.md) - Understanding OAuth security
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase setup guide
- [README.md](./README.md) - General project documentation
- [.env.example](./.env.example) - Environment variable reference

## Need More Help?

If you're still having issues after following this guide:

1. Open a GitHub issue with:
   - Specific error message from browser console
   - What you've tried so far
   - Whether it works locally or only fails in production
   
   **Create an issue at:** https://github.com/Unwrenchable/9dttt/issues

2. Check Firebase Status Page:
   - https://status.firebase.google.com/

3. Review Firebase Documentation:
   - https://firebase.google.com/docs/auth/web/google-signin
