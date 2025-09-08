# Deployment Guide

## Vercel Deployment

This Next.js application is now configured for Vercel deployment.

### Prerequisites

1. Make sure you have a Vercel account
2. Install Vercel CLI: `npm i -g vercel`

### Environment Variables

Before deploying, you need to set up the following environment variables in your Vercel dashboard:

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add the following variables:

```
NEXT_PUBLIC_BACKEND_URL=https://your-backend-api-url.com
```

### Deployment Steps

1. **Deploy via Vercel CLI:**
   ```bash
   vercel --prod
   ```

2. **Deploy via GitHub (Recommended):**
   - Connect your GitHub repository to Vercel
   - Vercel will automatically deploy on every push to main branch

3. **Manual deployment:**
   - Push your code to GitHub
   - Import the repository in Vercel dashboard
   - Set environment variables
   - Deploy

### Important Notes

- The `vercel.json` file has been updated to work with Next.js
- Make sure your backend API is accessible from the deployed frontend
- Update `NEXT_PUBLIC_BACKEND_URL` to point to your actual backend URL
- The app uses Supabase for authentication (if configured)

### Troubleshooting

If you get a 404 error:
1. Check that `vercel.json` is configured for Next.js (✅ Fixed)
2. Ensure environment variables are set correctly
3. Verify your backend API is running and accessible
4. Check Vercel deployment logs for any build errors