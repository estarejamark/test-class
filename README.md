# Academia de San Martin - Classroom Management System

A comprehensive web-based classroom management system for Academia de San Martin, Daanbantayan, Cebu.

## Features

### For Administrators
- User management (Teachers, Students)
- Section and subject management
- Class enrollment management
- Teacher load assignment
- Quarter package approval workflow
- School year and quarter management
- System settings and configuration
- Reports and analytics

### For Teachers
- Attendance tracking
- Grade encoding (quarterly)
- Student feedback management
- Advisory class management
- Quarter package submission
- Reports generation

### For Students
- View attendance records
- View grades and quarterly packages
- Respond to teacher feedback
- Download quarterly reports
- Track academic progress

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Kotlin, Spring Boot, PostgreSQL
- **Authentication**: JWT with session fallback
- **UI Components**: Radix UI, shadcn/ui

## Quick Start

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd CAPSTONE-main
```

2. **Start Backend**
```bash
cd CTU_DB_API
./gradlew bootRun
```

3. **Start Frontend**
```bash
cd CTU_DaanBantayan_UI
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

## Project Structure

```
CAPSTONE-main/
├── CTU_DaanBantayan_UI/     # Next.js Frontend
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
│
├── CTU_DB_API/              # Spring Boot Backend
│   └── src/
│       └── main/
│           ├── kotlin/      # Kotlin source code
│           └── resources/   # Configuration files
│
├── ctu_db.sql               # Database schema and seed data
├── DEPLOYMENT.md            # Deployment guide
└── TODO.md                  # Production checklist
```

## Default Credentials

**Admin Account:**
- Email: `admin@admin.com`
- Password: `admin123`

⚠️ **Change these credentials immediately after first login!**

## Key Improvements (Latest Release)

- ✅ Simplified authentication logic
- ✅ Fixed duplicate footer rendering
- ✅ Added error boundary for better error handling
- ✅ Improved loading states
- ✅ Implemented lazy loading for dashboard components
- ✅ Optimized bundle size (removed unused dependencies)
- ✅ Enhanced security configurations
- ✅ Better code organization

## API Documentation

API endpoints are documented in `CTU_DaanBantayan_UI/API_ENDPOINTS.md`

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - Academia de San Martin

## Support

For technical support or questions, contact the development team.

## Changelog

### Version 1.0.0 (Production Ready)
- Initial production release
- Complete authentication system
- Full CRUD operations for all entities
- Quarter package workflow
- Reports generation
- Optimized performance
- Security hardening
