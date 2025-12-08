# Vercel Deployment Guide

## 🚀 Quick Deployment to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Backend API deployed somewhere (Railway, Render, or local server with ngrok)

## Step 1: Push to GitHub

```bash
cd CAPSTONE-main
git init
git add .
git commit -m "Initial commit - Production ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Step 2: Deploy Frontend to Vercel

### Option A: Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select `CTU_DaanBantayan_UI` as root directory
5. Configure environment variables (see below)
6. Click "Deploy"

### Option B: Vercel CLI

```bash
cd CTU_DaanBantayan_UI
npm i -g vercel
vercel login
vercel
```

## Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

**Important:** Replace with your actual backend API URL

## Step 4: Deploy Backend

### Option 1: Railway (Recommended for Spring Boot)

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Deploy from GitHub (select CTU_DB_API folder)
4. Add PostgreSQL database
5. Set environment variables:
   ```
   spring.datasource.url=postgresql://...
   spring.datasource.username=...
   spring.datasource.password=...
   jwt.secret=your-secret-key
   ```
6. Copy the public URL
7. Update Vercel environment variable with this URL

### Option 2: Render

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Select `CTU_DB_API` folder
5. Build command: `./gradlew build`
6. Start command: `java -jar build/libs/CTU_DB_API-0.0.1-SNAPSHOT.jar`
7. Add PostgreSQL database
8. Set environment variables
9. Deploy

### Option 3: Local Backend with ngrok (Testing Only)

```bash
# Start backend locally
cd CTU_DB_API
./gradlew bootRun

# In another terminal
ngrok http 8080

# Copy the ngrok URL and use it in Vercel
```

## Step 5: Update CORS in Backend

In your Spring Boot backend, update CORS configuration to allow Vercel domain:

```kotlin
@Configuration
class CorsConfig {
    @Bean
    fun corsConfigurer() = WebMvcConfigurer {
        addCorsMappings {
            addMapping("/**")
                .allowedOrigins(
                    "http://localhost:3000",
                    "https://your-app.vercel.app"  // Add your Vercel URL
                )
                .allowedMethods("*")
                .allowCredentials(true)
        }
    }
}
```

## Step 6: Database Setup

### Option 1: Neon (Free PostgreSQL)

1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Import database:
   ```bash
   psql "your-connection-string" < ctu_db.sql
   ```

### Option 2: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Use SQL Editor to import `ctu_db.sql`
4. Copy connection string

### Option 3: Railway PostgreSQL

1. Add PostgreSQL to your Railway project
2. Connect and import database

## Step 7: Verify Deployment

1. Visit your Vercel URL
2. Try logging in with: `admin@admin.com` / `admin123`
3. Check browser console for errors
4. Verify API calls work (Network tab)

## Troubleshooting

### Build Fails on Vercel

**Error: Out of memory**
- Vercel has memory limits on free tier
- Solution: Already optimized with lazy loading

**Error: Module not found**
```bash
# Locally, clear and rebuild
rm -rf node_modules .next
npm install
npm run build
```

### API Connection Issues

**CORS Error:**
- Update backend CORS to include Vercel domain
- Ensure credentials are allowed

**404 on API calls:**
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is running
- Check backend logs

### Database Connection

**Connection refused:**
- Verify database is accessible from backend host
- Check connection string format
- Ensure SSL is enabled if required

## Environment Variables Checklist

### Vercel (Frontend)
- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL

### Backend Host (Railway/Render)
- [ ] `spring.datasource.url` - Database connection
- [ ] `spring.datasource.username` - DB username
- [ ] `spring.datasource.password` - DB password
- [ ] `jwt.secret` - JWT secret key (min 256 bits)
- [ ] `server.port` - Usually 8080

## Cost Estimate

- **Vercel**: Free (Hobby plan)
- **Railway**: ~$5/month (with PostgreSQL)
- **Render**: Free tier available
- **Neon**: Free tier (0.5GB storage)

## Post-Deployment

1. Change admin password immediately
2. Test all features
3. Monitor Vercel Analytics
4. Check backend logs
5. Set up custom domain (optional)

## Custom Domain (Optional)

1. In Vercel → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Wait for SSL certificate

## Monitoring

- **Vercel Analytics**: Built-in, free
- **Backend Logs**: Check Railway/Render dashboard
- **Database**: Monitor connection count

## Backup Strategy

```bash
# Backup database regularly
pg_dump "your-connection-string" > backup_$(date +%Y%m%d).sql
```

## Support

If deployment fails:
1. Check Vercel build logs
2. Check backend logs
3. Verify all environment variables
4. Test API endpoints directly
5. Check CORS configuration

## Success Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed (Railway/Render)
- [ ] Database created and imported
- [ ] Environment variables set
- [ ] CORS configured
- [ ] Can login successfully
- [ ] API calls working
- [ ] All features functional

🎉 **Deployment Complete!**
