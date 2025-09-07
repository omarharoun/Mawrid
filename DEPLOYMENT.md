# Vercel Deployment Guide

## Deploying Mawrid Search Engine to Vercel

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **OpenAI API Key**: Get your API key from [OpenAI](https://platform.openai.com)

### Deployment Steps

#### Method 1: Deploy via Vercel Dashboard

1. **Connect GitHub Repository**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository: `omarharoun/Mawrid`

2. **Configure Environment Variables**
   - In the project settings, go to "Environment Variables"
   - Add the following variables:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     DATABASE_URL=sqlite:///./mawrid_search.db
     DEBUG=False
     ```

3. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

#### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Directory**
   ```bash
   cd /path/to/Mawrid
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add DATABASE_URL
   vercel env add DEBUG
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Configuration Files

The following files are configured for Vercel deployment:

- `vercel.json`: Vercel configuration
- `vercel_main.py`: Vercel-compatible main application
- `requirements.txt`: Python dependencies
- `.vercelignore`: Files to ignore during deployment

### Environment Variables

Set these environment variables in Vercel:

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |
| `DATABASE_URL` | Database connection string | `sqlite:///./mawrid_search.db` |
| `DEBUG` | Debug mode | `False` |
| `APP_NAME` | Application name | `Mawrid Search Engine` |
| `APP_VERSION` | Application version | `1.0.0` |

### Limitations on Vercel

1. **Serverless Functions**: Each request runs in a serverless function
2. **Execution Time**: Maximum 30 seconds per request
3. **Memory**: Limited memory per function
4. **Database**: SQLite files are ephemeral (use external database for production)
5. **File System**: Read-only file system (except `/tmp`)

### Production Considerations

For production deployment, consider:

1. **External Database**: Use PostgreSQL or another external database
2. **Caching**: Implement Redis for caching
3. **CDN**: Use Vercel's CDN for static assets
4. **Monitoring**: Set up monitoring and logging
5. **Rate Limiting**: Implement rate limiting for API endpoints

### Custom Domain

1. **Add Domain in Vercel Dashboard**
   - Go to project settings
   - Add your custom domain
   - Configure DNS settings

2. **SSL Certificate**
   - Vercel automatically provides SSL certificates
   - HTTPS is enabled by default

### Troubleshooting

#### Common Issues

1. **Import Errors**
   - Ensure all dependencies are in `requirements.txt`
   - Check Python path configuration

2. **Environment Variables**
   - Verify all required environment variables are set
   - Check variable names and values

3. **Database Issues**
   - SQLite files are ephemeral on Vercel
   - Consider using external database for production

4. **Timeout Issues**
   - Optimize code for faster execution
   - Consider breaking down large operations

#### Debugging

1. **Check Vercel Logs**
   ```bash
   vercel logs
   ```

2. **Local Testing**
   ```bash
   vercel dev
   ```

3. **Function Logs**
   - Check function logs in Vercel dashboard
   - Monitor performance metrics

### Performance Optimization

1. **Cold Start Optimization**
   - Minimize imports
   - Use connection pooling
   - Cache frequently used data

2. **Response Time**
   - Optimize database queries
   - Implement caching
   - Use async operations

3. **Memory Usage**
   - Monitor memory consumption
   - Optimize data structures
   - Clean up resources

### Monitoring

1. **Vercel Analytics**
   - Enable Vercel Analytics
   - Monitor performance metrics

2. **Error Tracking**
   - Set up error tracking
   - Monitor function errors

3. **Uptime Monitoring**
   - Use external monitoring services
   - Set up alerts

### Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **FastAPI on Vercel**: [vercel.com/docs/functions/serverless-functions/runtimes/python](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- **GitHub Issues**: Report issues in your repository
