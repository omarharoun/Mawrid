# Deployment Guide

## Vercel Deployment

This Next.js application is now configured for Vercel deployment with direct API integrations.

### Prerequisites

1. Make sure you have a Vercel account
2. Install Vercel CLI: `npm i -g vercel`
3. Get API keys from:
   - [Tavily](https://tavily.com/) - for web search functionality
   - [OpenAI](https://platform.openai.com/) - for AI summaries

### Environment Variables

Before deploying, you need to set up the following environment variables in your Vercel dashboard:

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add the following **required** variables:

```
TAVILY_API_KEY=your_tavily_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

**Optional variables** (if using Supabase authentication):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
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

- The application now uses direct API calls instead of a separate backend
- **TAVILY_API_KEY** is required for search functionality
- **OPENAI_API_KEY** is required for AI summaries
- Make sure both API keys are valid and have sufficient credits/quota
- The app uses Supabase for authentication (if configured)

### Troubleshooting

If you get errors:
1. **"Tavily API key not configured"** - Set the TAVILY_API_KEY environment variable
2. **"OpenAI API key not configured"** - Set the OPENAI_API_KEY environment variable
3. **Search not working** - Check that your Tavily API key is valid and has quota
4. **AI summaries not working** - Check that your OpenAI API key is valid and has credits
5. Check Vercel deployment logs for any build errors

### Getting API Keys

1. **Tavily API Key:**
   - Sign up at https://tavily.com/
   - Go to your dashboard and get your API key
   - Tavily provides web search capabilities

2. **OpenAI API Key:**
   - Sign up at https://platform.openai.com/
   - Go to API Keys section and create a new key
   - Make sure you have credits in your account