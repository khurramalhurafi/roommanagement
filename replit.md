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

## Default Login
- Admin: admin@company.com / admin123
- HR User: sarah.hr@company.com / hr12345

## Database Schema
- `users` - System users (id, name, email, password, role, status)
- `rooms` - Accommodation rooms (id, room_number, building, floor, capacity, status, qr_hash)
- `employees` - Employee records (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id)
- `transfer_logs` - Room transfer history (id, employee_id, from_room_id, to_room_id, transferred_at, transferred_by)

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
Key packages: express, express-session, connect-pg-simple, bcryptjs, qrcode, drizzle-orm, pg, wouter, @tanstack/react-query, react-hook-form
