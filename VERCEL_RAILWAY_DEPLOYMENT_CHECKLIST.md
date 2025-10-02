# 🚀 PTimeBuddy Production Deployment Checklist

## Issue: Mobile/External Access Redirects to Vercel Default Page
**Root Cause**: Supabase authentication redirect URLs not configured for production domain

---

## ✅ Deployment Status

### Frontend (Vercel)
- **URL**: `https://ptimebuddy-frontend.vercel.app`
- **Status**: ✅ Deployed
- **Environment Variables**: ✅ Configured (verified in screenshot)

### Backend (Railway)
- **Platform**: Railway
- **Status**: ⚠️ Needs CORS configuration verification

### Database (Supabase)
- **Status**: 🔴 **NEEDS FIXING** - Site URL truncated, redirect URLs incomplete

---

## 🔧 STEP-BY-STEP FIX (Do in Order)

### Step 1: Fix Supabase URL Configuration 🔴 **CRITICAL**

#### 1.1 Update Site URL
1. Go to: [Supabase Dashboard](https://app.supabase.com) → Your Project → **Authentication** → **URL Configuration**
2. Find: **Site URL** field (currently shows `https://ptimebuddy-fron` - TRUNCATED)
3. Update to: `https://ptimebuddy-frontend.vercel.app`
4. Click **Save**

#### 1.2 Update Redirect URLs
In the same **URL Configuration** page, update **Redirect URLs** section:

**Remove or verify these exist:**
```
http://localhost:5173
http://localhost:5173/auth/callback
http://localhost:4173
http://localhost:4173/auth/callback
http://10.133.21.128:5173
http://10.133.21.128:5173/auth/callback
```

**ADD these production URLs:**
```
https://ptimebuddy-frontend.vercel.app
https://ptimebuddy-frontend.vercel.app/
https://ptimebuddy-frontend.vercel.app/**
https://ptimebuddy-frontend.vercel.app/auth/callback
https://*.vercel.app
https://*.vercel.app/auth/callback
```

> **Note**: The wildcard `*.vercel.app` allows preview deployments to work

Click **Save changes** after adding all URLs.

---

### Step 2: Verify Railway Backend Configuration

#### 2.1 Check Environment Variables
Go to: [Railway Dashboard](https://railway.app) → Your Backend Project → **Variables**

**Required Environment Variables:**
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Server Configuration
NODE_ENV=production
PORT=3000

# CORS Configuration - CRITICAL!
ALLOWED_ORIGINS=https://ptimebuddy-frontend.vercel.app

# Optional: Add preview deployments support
# ALLOWED_ORIGINS=https://ptimebuddy-frontend.vercel.app,https://ptimebuddy-frontend-*.vercel.app
```

#### 2.2 Verify ALLOWED_ORIGINS
**Current Issue**: If `ALLOWED_ORIGINS` doesn't include your Vercel URL, API calls will fail with CORS errors.

1. Click on `ALLOWED_ORIGINS` variable in Railway
2. Verify it contains: `https://ptimebuddy-frontend.vercel.app`
3. If it doesn't exist or is wrong, update it
4. Railway will auto-redeploy after variable changes

#### 2.3 Get Your Railway Backend URL
1. Go to Railway → Your Backend Project → **Settings** → **Domains**
2. Copy the public URL (something like `https://your-app.railway.app` or custom domain)
3. **Save this URL** - you'll verify it in Step 3

---

### Step 3: Verify Vercel Environment Variables

Go to: [Vercel Dashboard](https://vercel.com) → ptimebuddy-frontend → **Settings** → **Environment Variables**

**Verify these Production variables exist:**

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Production ✅ |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Production ✅ |
| `VITE_API_BASE_URL` | `https://your-app.railway.app` | Production ⚠️ VERIFY |
| `VITE_GOOGLE_MAPS_API_KEY` | Your Google Maps key | Production ✅ |

**IMPORTANT**: Check that `VITE_API_BASE_URL` matches your Railway backend URL from Step 2.3

If you need to update `VITE_API_BASE_URL`:
1. Click the three dots (...) next to the variable
2. Click **Edit**
3. Update the value to your Railway URL (e.g., `https://ptimebuddy-backend.railway.app`)
4. Click **Save**

---

### Step 4: Redeploy Both Applications

#### 4.1 Railway Backend (if you changed ALLOWED_ORIGINS)
- Railway auto-deploys when environment variables change
- Wait for deployment to complete (check Railway dashboard)

#### 4.2 Vercel Frontend
1. Go to Vercel → **Deployments** tab
2. Find the latest deployment
3. Click three dots (...) → **Redeploy**
4. Check "Use existing build cache" → Click **Redeploy**

---

### Step 5: Test the Deployment

#### 5.1 Test on Desktop
1. Open **Incognito/Private browsing window**
2. Go to: `https://ptimebuddy-frontend.vercel.app`
3. Click "Get Started" (Employee signup)
4. Try signing in with Google
5. Verify redirect works and you land back on the app

#### 5.2 Test on Mobile
1. Open mobile browser (Chrome/Safari)
2. Go to: `https://ptimebuddy-frontend.vercel.app`
3. Try the same signup flow
4. **Expected**: Should redirect to Google OAuth, then back to your app
5. **Previous Bug**: Redirected to Vercel default page

#### 5.3 Check Browser Console
If issues persist:
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for errors related to:
   - CORS errors → Backend `ALLOWED_ORIGINS` not set correctly
   - Supabase errors → Check Supabase redirect URL configuration
   - API errors → Check `VITE_API_BASE_URL` is correct

---

## 🔍 Troubleshooting Guide

### Issue: "Redirects to Vercel default page"
**Cause**: Supabase Site URL or Redirect URLs not configured for production
**Fix**: Complete Step 1 above

### Issue: "CORS policy error" in browser console
```
Access to fetch at 'https://your-backend.railway.app/auth/complete' from origin 'https://ptimebuddy-frontend.vercel.app' has been blocked by CORS policy
```
**Cause**: Railway `ALLOWED_ORIGINS` doesn't include Vercel URL
**Fix**: 
1. Go to Railway → Variables
2. Set `ALLOWED_ORIGINS=https://ptimebuddy-frontend.vercel.app`
3. Wait for auto-redeploy

### Issue: "Network request failed" or API errors
**Cause**: `VITE_API_BASE_URL` not set or incorrect
**Fix**:
1. Verify Railway backend is running (check Railway logs)
2. Verify `VITE_API_BASE_URL` in Vercel matches Railway URL
3. Redeploy Vercel after fixing

### Issue: "OAuth redirect mismatch"
**Cause**: Missing redirect URLs in Supabase
**Fix**: Add all URLs from Step 1.2

### Issue: Works on localhost, fails in production
**Checklist**:
- [ ] Supabase Site URL = `https://ptimebuddy-frontend.vercel.app`
- [ ] Supabase Redirect URLs include production URL
- [ ] Railway `ALLOWED_ORIGINS` includes Vercel URL
- [ ] Vercel `VITE_API_BASE_URL` = Railway backend URL
- [ ] All environment variables are in "Production" environment in Vercel

---

## 📊 Quick Verification Checklist

Before testing, verify all these are ✅:

### Supabase Dashboard
- [ ] Site URL: `https://ptimebuddy-frontend.vercel.app`
- [ ] Redirect URLs include: `https://ptimebuddy-frontend.vercel.app`
- [ ] Redirect URLs include: `https://ptimebuddy-frontend.vercel.app/auth/callback`
- [ ] Redirect URLs include: `https://*.vercel.app` (for previews)

### Railway Backend
- [ ] `ALLOWED_ORIGINS` = `https://ptimebuddy-frontend.vercel.app`
- [ ] `NODE_ENV` = `production`
- [ ] `SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] Backend is deployed and running (check Railway logs)
- [ ] Public domain is accessible

### Vercel Frontend
- [ ] `VITE_API_BASE_URL` = Railway backend URL
- [ ] `VITE_SUPABASE_URL` is set (Production)
- [ ] `VITE_SUPABASE_ANON_KEY` is set (Production)
- [ ] Latest deployment is live
- [ ] No build errors in deployment logs

---

## 🎯 Expected Result After Fix

### Working Flow:
1. User visits `https://ptimebuddy-frontend.vercel.app` on any device
2. Clicks "Get Started" or "Sign In"
3. Enters email or clicks "Continue with Google"
4. Redirected to Google OAuth
5. **Redirected back to** `https://ptimebuddy-frontend.vercel.app/?role=employee`
6. Profile created/loaded
7. Redirected to dashboard: `/app/employee` or `/app/employer`

### What Was Broken:
- Step 5: Redirected to Vercel's default 404 page instead of app
- **Reason**: Supabase didn't recognize the production domain as valid

---

## 🚨 Common Mistakes to Avoid

1. **Forgetting to redeploy Vercel** after changing environment variables
2. **Not including trailing slash variants** in Supabase redirect URLs
3. **Wrong Railway URL** in `VITE_API_BASE_URL` (common if backend was redeployed)
4. **Forgetting wildcards** for Vercel preview deployments
5. **Environment variables in wrong environment** (Preview vs Production in Vercel)

---

## 📝 Backend Railway URL Reference

Your Railway backend should be accessible at one of these patterns:
- `https://your-app-name.up.railway.app`
- `https://ptimebuddy-backend.railway.app` (if using custom name)
- Custom domain if configured

**To find it:**
1. Railway Dashboard → Your Project
2. Settings → Domains
3. Copy the public URL

**This URL must match** `VITE_API_BASE_URL` in Vercel exactly (no trailing slash).

---

## ✅ Post-Deployment Verification

After completing all steps above, run these tests:

### Test 1: Desktop Browser (Incognito)
```
1. Visit: https://ptimebuddy-frontend.vercel.app
2. Click: "Get Started"
3. Click: "Continue with Google"
4. Complete Google OAuth
5. ✅ Should land on: https://ptimebuddy-frontend.vercel.app/?role=employee
6. ✅ Should redirect to: /app/employee or /app/employer
```

### Test 2: Mobile Browser
```
1. Visit: https://ptimebuddy-frontend.vercel.app
2. Follow same flow as Test 1
3. ✅ Should work identically to desktop
```

### Test 3: API Connection
```
1. Open browser DevTools → Network tab
2. Sign in with Google
3. Look for request to: https://your-backend.railway.app/auth/complete
4. ✅ Should return 200 OK
5. ✅ Should NOT show CORS errors
```

---

## 🆘 Still Having Issues?

If problems persist after following all steps:

1. **Check Railway Logs**:
   - Railway Dashboard → Your Project → Deployments → View Logs
   - Look for CORS errors or startup errors

2. **Check Vercel Deployment Logs**:
   - Vercel Dashboard → Deployments → Click latest → View Function Logs
   - Look for build errors or environment variable issues

3. **Check Supabase Logs**:
   - Supabase Dashboard → Logs → Auth logs
   - Look for rejected redirect URLs

4. **Clear Browser Cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or use Incognito mode

5. **Verify Network Requests**:
   - Open DevTools → Network tab
   - Filter by "XHR" or "Fetch"
   - Check if API calls are going to correct Railway URL

---

## 📞 Support Checklist

If you need help, provide:
- [ ] Railway backend URL (from Railway → Settings → Domains)
- [ ] Vercel deployment URL (should be `https://ptimebuddy-frontend.vercel.app`)
- [ ] Screenshot of Supabase URL Configuration page
- [ ] Screenshot of Railway environment variables (hide sensitive values)
- [ ] Browser console errors (screenshot)
- [ ] Network tab showing failed request (if applicable)

---

**Last Updated**: Generated after Vercel environment variables verification
**Status**: Ready to deploy once Supabase URLs are fixed

