# 🚀 Quick Start Guide

Get the Rasid Money Transfer System up and running in 10 minutes.

---

## Prerequisites Checklist

- [ ] Node.js 20+ installed
- [ ] PostgreSQL 15+ installed and running
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

---

## Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone <repository-url>
cd money-transfer-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## Step 2: Database Setup (3 minutes)

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE money_transfer_db;
\q

# Configure backend environment
cd backend
cp .env.example .env

# Edit .env file with your database credentials:
# DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/money_transfer_db

# Run migrations
npx prisma generate
npx prisma migrate deploy

# Seed initial data
npm run seed
```

---

## Step 3: Configure Frontend (1 minute)

```bash
cd frontend
cp .env.example .env.local

# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
# NEXT_PUBLIC_JWT_SECRET=your-super-secret-key
```

---

## Step 4: Start Development Servers (1 minute)

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Backend running on http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm run dev
# Frontend running on http://localhost:3000
```

---

## Step 5: Access the Application (1 minute)

Open your browser and navigate to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

### Login Credentials

**Super Admin:**
- Email: `superadmin@moneytransfer.com`
- Password: `SuperAdmin@123`

**Regular Admin:**
- Email: `admin@moneytransfer.com`
- Password: `Admin@123`

---

## ✅ Verification

Test that everything works:

1. **Frontend loads** - You should see the login page
2. **Login works** - Use super admin credentials
3. **Dashboard loads** - You should see the admin dashboard
4. **API responds** - Visit http://localhost:5000/api/health

---

## 🔧 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Verify database exists
psql -U postgres -l | grep money_transfer_db

# Check .env DATABASE_URL is correct
```

### Port Already in Use
```bash
# Backend (port 5000)
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000

# Frontend (port 3000)
# Windows: netstat -ano | findstr :3000
# Mac/Linux: lsof -i :3000
```

### Prisma Client Not Generated
```bash
cd backend
npx prisma generate
```

### Module Not Found Errors
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Next Steps

After successful setup:

1. **Explore the Admin Panel**
   - User management
   - Transaction management
   - System settings

2. **Read the Documentation**
   - [API Reference](api/)
   - [Deployment Guide](deployment/)
   - [Architecture Overview](architecture/)

3. **Try the API**
   - [cURL Examples](api/CURL_TESTS_SETTINGS.md)
   - Test endpoints with Postman

4. **Customize the System**
   - Update system settings
   - Configure exchange rates
   - Customize email templates

---

## 🆘 Need Help?

- **Documentation:** [docs/README.md](README.md)
- **Troubleshooting:** [deployment/TROUBLESHOOTING_SETTINGS.md](deployment/TROUBLESHOOTING_SETTINGS.md)
- **API Reference:** [api/](api/)
- **Support:** support@rasid.com

---

**Happy coding! 🎉**
