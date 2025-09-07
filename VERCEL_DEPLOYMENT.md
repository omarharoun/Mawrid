# Vercel Deployment Guide

## Quick Deploy to Vercel

### 1. Set Environment Variables in Vercel Dashboard

Go to your Vercel project settings and add these environment variables:

```
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
APP_NAME=Mawrid Search Engine
DEBUG=False
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///tmp/mawrid_search.db
MAX_SEARCH_RESULTS=20
CRAWL_DELAY=1
MAX_CRAWL_DEPTH=2
```

### 2. Deploy

The app is now configured for Vercel deployment. Simply push to your GitHub repository and Vercel will automatically deploy.

### 3. Test Your Deployment

After deployment, test these endpoints:
- `https://your-app.vercel.app/` - Home page
- `https://your-app.vercel.app/health` - Health check
- `https://your-app.vercel.app/api/search/?query=test` - Search API

## What Was Fixed

1. ✅ **Fixed vercel.json** - Removed conflicting `builds` property
2. ✅ **Updated requirements-vercel.txt** - Added all necessary dependencies
3. ✅ **Fixed API handler** - Added Mangum for ASGI compatibility
4. ✅ **Created .vercelignore** - Excludes unnecessary files
5. ✅ **Updated environment config** - Vercel-compatible settings
6. ✅ **Removed Docker files** - Not needed for Vercel

## Troubleshooting

If you still get errors:
1. Check Vercel function logs in the dashboard
2. Ensure `OPENAI_API_KEY` is set correctly
3. Verify all dependencies are in `requirements-vercel.txt`
