# Deployment Guide - Academia de San Martin Management System

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Java JDK 21
- PostgreSQL 17+
- Git

## Frontend Deployment (Next.js)

### 1. Install Dependencies
```bash
cd CTU_DaanBantayan_UI
npm install
```

### 2. Configure Environment
Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

For production, update with your actual API URL.

### 3. Build
```bash
npm run build
```

### 4. Run Production Server
```bash
npm start
```

The app will run on `http://localhost:3000`

### Deploy to Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy

## Backend Deployment (Spring Boot)

### 1. Configure Database
Create PostgreSQL database:
```sql
CREATE DATABASE ctu_db;
```

### 2. Set Environment Variables
Create `.env` file in `CTU_DB_API` folder:
```env
spring.datasource.url=jdbc:postgresql://localhost:5432/ctu_db
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.datasource.driver-class-name=org.postgresql.Driver

# JWT Configuration
jwt.secret=your-secret-key-min-256-bits
jwt.expiration=3600000

# Server Configuration
server.port=8080
```

### 3. Build Application
```bash
cd CTU_DB_API
./gradlew build
```

On Windows:
```bash
gradlew.bat build
```

### 4. Run Application
```bash
java -jar build/libs/CTU_DB_API-0.0.1-SNAPSHOT.jar
```

The API will run on `http://localhost:8080`

## Database Setup

### Import Initial Data
```bash
psql -U your_username -d ctu_db -f ctu_db.sql
```

### Default Admin Credentials
- Email: `admin@admin.com`
- Password: `admin123`

**⚠️ IMPORTANT: Change this password immediately after first login!**

## Production Checklist

### Security
- [ ] Change default admin password
- [ ] Set strong JWT secret (min 256 bits)
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain only
- [ ] Set secure cookie flags
- [ ] Enable database SSL connection

### Performance
- [ ] Enable database connection pooling
- [ ] Set up CDN for static assets
- [ ] Configure caching headers
- [ ] Enable gzip compression

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure application logs
- [ ] Set up database backups
- [ ] Monitor API response times

## Troubleshooting

### Frontend Issues

**Build fails:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

**API connection errors:**
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify CORS is configured on backend
- Check network/firewall settings

### Backend Issues

**Database connection fails:**
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

**Port already in use:**
```bash
# Change port in application.properties
server.port=8081
```

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review error messages in browser console
3. Check database connection
4. Verify all environment variables are set

## Updates

To update the application:

### Frontend
```bash
git pull
npm install
npm run build
npm start
```

### Backend
```bash
git pull
./gradlew build
# Restart the application
```

## Backup

### Database Backup
```bash
pg_dump -U your_username ctu_db > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql -U your_username -d ctu_db < backup_20240101.sql
```
