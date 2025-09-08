# Mawrid - AI-Powered Search Engine

An AI-powered search application built with Next.js that provides intelligent search results with AI-generated summaries.

- **Framework**: Next.js App Router (v14)
- **Search**: Tavily API for web search
- **AI**: OpenAI GPT for intelligent summaries
- **Styling**: Tailwind CSS
- **Auth/DB**: Supabase (optional)

## Features

- 🔍 Real-time web search powered by Tavily
- 🤖 AI-generated summaries using OpenAI GPT
- ⚡ Fast and responsive interface
- 📱 Mobile-friendly design
- 🔐 Optional user authentication

## Setup

### 1. Get API Keys

You'll need API keys from:
- [Tavily](https://tavily.com/) - for web search functionality
- [OpenAI](https://platform.openai.com/) - for AI summaries

### 2. Environment Variables

Copy the example environment file:
```bash
cp env.example .env.local
```

Set the required environment variables in `.env.local`:
```bash
# Required
TAVILY_API_KEY=your_tavily_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Optional (for authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install & Run

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## Deploy to Vercel

1. Push this repository to GitHub
2. Import the repository in Vercel
3. Set the environment variables in Vercel Project Settings → Environment Variables:
   - `TAVILY_API_KEY`
   - `OPENAI_API_KEY`
   - (Optional) Supabase keys if using authentication
4. Deploy!

## Project Structure

- `src/app` – Next.js App Router pages and API routes
- `src/app/api/search` – Search API endpoint with Tavily and OpenAI integration
- `src/lib` – Utility functions and configurations
- `src/app/components` – React components

## API Endpoints

- `POST /api/search` – Main search endpoint
- `GET /api/search?query=...` – Get search suggestions

## Troubleshooting

If you encounter issues:

1. **"Tavily API key not configured"** - Make sure `TAVILY_API_KEY` is set
2. **"OpenAI API key not configured"** - Make sure `OPENAI_API_KEY` is set  
3. **Search not working** - Check that your API keys are valid and have quota
4. **Build errors** - Run `npm install` to ensure all dependencies are installed

For more details, see [DEPLOYMENT.md](./DEPLOYMENT.md).
