# Employee Accommodation Management System (EAM)

## Overview
Web-based system for managing company employee accommodation using QR-based room identification. Built for HR & Administration departments.

## Architecture
- **Frontend:** React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** Session-based with bcrypt password hashing
- **QR:** Server-side QR code generation with `qrcode` package

## User Roles
- **Super Admin:** Full access including user management
- **HR User:** Can manage employees and rooms, cannot manage system users

## Key Features
- Dashboard with occupancy stats and recent transfers
- Employee CRUD with room assignment and transfer tracking
- Room CRUD with auto-generated QR codes
- Public QR page (no login required) showing room details and employee cards
- User management (admin only)
- Session-based authentication with role-based access control
- Employee profile photo upload (JPG/PNG, 2MB limit)
- Export & Reporting: Employee list (Excel/PDF), Room list (Excel/PDF), QR codes (PDF single/grid layout)
- Export activity logging in export_logs table

## Default Login
- Admin: admin@company.com / admin123
- HR User: sarah.hr@company.com / hr12345

## Database Schema
- `users` - System users (id, name, email, password, role, status)
- `rooms` - Accommodation rooms (id, room_number, building, floor, capacity, status, qr_hash)
- `employees` - Employee records (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id)
- `transfer_logs` - Room transfer history (id, employee_id, from_room_id, to_room_id, transferred_at, transferred_by)
- `export_logs` - Export activity tracking (id, user_id, export_type, format, created_at)

## Project Structure
```
client/src/
  pages/        - Login, Dashboard, Employees, Rooms, Users, PublicRoom
  components/   - AppSidebar, shadcn UI components
server/
  index.ts      - Express app setup
  routes.ts     - API routes with auth middleware
  storage.ts    - Database storage layer
  db.ts         - Drizzle database connection
  seed.ts       - Initial data seeding
shared/
  schema.ts     - Drizzle schema + Zod validation
```

## Dependencies
Key packages: express, express-session, connect-pg-simple, bcryptjs, qrcode, drizzle-orm, pg, exceljs, pdfkit, multer, wouter, @tanstack/react-query, react-hook-form

## Export API Endpoints
- `GET /api/export/employees/excel` - Excel employee list (supports ?department, ?company, ?roomId, ?status filters)
- `GET /api/export/employees/pdf` - PDF employee list (same filters)
- `GET /api/export/rooms/excel` - Excel room list with occupancy stats
- `GET /api/export/rooms/pdf` - PDF room list with full/overcapacity highlighting
- `GET /api/export/rooms/qr-pdf?layout=single|grid` - QR code printable sheets (1 or 4 per page)
