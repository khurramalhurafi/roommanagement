# Employee Accommodation Management System (EAM)

## Overview
Web-based system for managing company employee accommodation using QR-based room identification. Built for HR & Administration departments.

## Architecture
- **Frontend:** React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** Session-based with bcrypt password hashing

## Project Structure
```
├── client/src/
│   ├── pages/
│   │   ├── dashboard.tsx       - Stats overview (employees, cabins, rooms, occupancy)
│   │   ├── porta-cabins.tsx    - Porta Cabin CRUD + Cabin Map view
│   │   ├── rooms.tsx           - Room management with cabin association
│   │   ├── employees.tsx       - Employee management + transfers + photo upload
│   │   ├── users-management.tsx- Admin user management
│   │   ├── public-room.tsx     - QR scan page (public, shows cabin+room info)
│   │   └── login.tsx           - Login page
│   ├── components/
│   │   └── app-sidebar.tsx     - Navigation sidebar
│   └── App.tsx                 - Routes + auth guard
├── server/
│   ├── routes.ts               - All API routes + export (Excel/PDF/QR-PDF)
│   ├── storage.ts              - Database operations via Drizzle ORM
│   ├── seed.ts                 - Initial data seeding
│   └── index.ts                - Express server entry
└── shared/
    └── schema.ts               - DB schema + Drizzle types
```

## Data Model
- **porta_cabins**: Physical cabin structures (name, location, status)
- **rooms**: Rooms grouped under porta cabins (portaCabinId FK, building legacy, floor, capacity, status, qrHash)
- **employees**: Employee records (employeeIdNo, iqama, mobile, department, company, profileImage, roomId FK)
- **users**: System users (admin/hr roles)
- **transfer_logs**: Audit trail of room assignments
- **export_logs**: Track export history

## Features
- QR code generation per room; public scan page shows cabin name, room info, and occupant list
- Porta Cabin management with map view showing occupancy per room
- Employee transfers between rooms with audit logging
- Employee profile photo upload (JPG/PNG, 2MB limit)
- Export to Excel/PDF for employees and rooms (grouped by cabin)
- QR code batch export (1-per-page or 4-per-page grid)
- Dashboard with 5 stat cards (employees, cabins, rooms, occupied, available)

## Routes
- `GET /` → Dashboard
- `GET /employees` → Employee management
- `GET /porta-cabins` → Porta Cabin management
- `GET /rooms` → Room management (supports `?cabinId=` filter)
- `GET /users` → Admin-only user management
- `GET /room/:hash` → Public QR scan page

## Credentials (Demo)
- Admin: `admin@company.com` / `admin123`
- HR: `sarah.hr@company.com` / `hr12345`

## Notes
- Profile images stored in `client/public/uploads/` 
- `npm run dev` starts the Vite + Express dev server on port 5000
- Schema changes: use `executeSql` in code_execution (drizzle-kit push is interactive)
- Existing rooms have `portaCabinId` set to appropriate cabin; new installs seeded via `seed.ts`
