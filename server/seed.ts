import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { storage } from "./storage";

async function createTablesIfNotExist() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS porta_cabins (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'hr',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      room_number TEXT NOT NULL UNIQUE,
      porta_cabin_id INTEGER REFERENCES porta_cabins(id),
      building TEXT,
      floor TEXT,
      capacity INTEGER NOT NULL DEFAULT 4,
      status TEXT NOT NULL DEFAULT 'available',
      qr_hash TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      employee_id_no TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      iqama TEXT NOT NULL,
      mobile TEXT NOT NULL,
      department TEXT NOT NULL,
      company TEXT NOT NULL,
      profile_image TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      room_id INTEGER REFERENCES rooms(id),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS transfer_logs (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      from_room_id INTEGER REFERENCES rooms(id),
      to_room_id INTEGER REFERENCES rooms(id),
      transferred_at TIMESTAMP DEFAULT NOW(),
      transferred_by INTEGER REFERENCES users(id)
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" VARCHAR NOT NULL COLLATE "default",
      "sess" JSON NOT NULL,
      "expire" TIMESTAMP(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS export_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      export_type TEXT NOT NULL,
      format TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

export async function seedDatabase() {
  await createTablesIfNotExist();

  const existingUsers = await storage.getAllUsers();
  if (existingUsers.length > 0) {
    return;
  }

  console.log("Seeding database with initial data...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const hrPassword = await bcrypt.hash("hr12345", 10);

  await storage.createUser({
    name: "System Administrator",
    email: "admin@company.com",
    password: adminPassword,
    role: "admin",
    status: "active",
  });

  await storage.createUser({
    name: "Sarah Johnson",
    email: "sarah.hr@company.com",
    password: hrPassword,
    role: "hr",
    status: "active",
  });

  const cabinsData = [
    { name: "Cabin A", location: "North Zone", status: "active" },
    { name: "Cabin B", location: "South Zone", status: "active" },
    { name: "Cabin C", location: "East Zone", status: "active" },
  ];

  const createdCabins = [];
  for (const c of cabinsData) {
    const cabin = await storage.createPortaCabin(c);
    createdCabins.push(cabin);
  }

  const roomsData = [
    { roomNumber: "A-101", portaCabinId: createdCabins[0].id, floor: "1", capacity: 4, status: "occupied" },
    { roomNumber: "A-102", portaCabinId: createdCabins[0].id, floor: "1", capacity: 4, status: "occupied" },
    { roomNumber: "A-201", portaCabinId: createdCabins[0].id, floor: "2", capacity: 3, status: "available" },
    { roomNumber: "B-101", portaCabinId: createdCabins[1].id, floor: "1", capacity: 4, status: "occupied" },
    { roomNumber: "B-102", portaCabinId: createdCabins[1].id, floor: "1", capacity: 4, status: "available" },
    { roomNumber: "B-201", portaCabinId: createdCabins[1].id, floor: "2", capacity: 3, status: "available" },
    { roomNumber: "C-101", portaCabinId: createdCabins[2].id, floor: "1", capacity: 6, status: "maintenance" },
    { roomNumber: "C-102", portaCabinId: createdCabins[2].id, floor: "1", capacity: 4, status: "available" },
  ];

  const createdRooms = [];
  for (const r of roomsData) {
    const qrHash = crypto.randomBytes(16).toString("hex");
    const room = await storage.createRoom({ ...r, qrHash });
    createdRooms.push(room);
  }

  const employeesData = [
    { employeeIdNo: "EMP-001", name: "Ahmed Al-Rashid", iqama: "2400001234", mobile: "+966501234567", department: "Engineering", company: "Al Rajhi Construction", status: "active", roomId: createdRooms[0].id },
    { employeeIdNo: "EMP-002", name: "Mohammed Hassan", iqama: "2400001235", mobile: "+966501234568", department: "Engineering", company: "Al Rajhi Construction", status: "active", roomId: createdRooms[0].id },
    { employeeIdNo: "EMP-003", name: "Khalid Ibrahim", iqama: "2400001236", mobile: "+966501234569", department: "Maintenance", company: "Saudi Services Ltd", status: "active", roomId: createdRooms[0].id },
    { employeeIdNo: "EMP-004", name: "Omar Saleh", iqama: "2400001237", mobile: "+966501234570", department: "Operations", company: "Gulf Industrial Co", status: "active", roomId: createdRooms[1].id },
    { employeeIdNo: "EMP-005", name: "Yousef Al-Ghamdi", iqama: "2400001238", mobile: "+966501234571", department: "Operations", company: "Gulf Industrial Co", status: "active", roomId: createdRooms[1].id },
    { employeeIdNo: "EMP-006", name: "Ali Mansoor", iqama: "2400001239", mobile: "+966501234572", department: "Engineering", company: "Al Rajhi Construction", status: "active", roomId: createdRooms[3].id },
    { employeeIdNo: "EMP-007", name: "Faisal Al-Otaibi", iqama: "2400001240", mobile: "+966501234573", department: "IT", company: "Saudi Tech Solutions", status: "active", roomId: createdRooms[3].id },
    { employeeIdNo: "EMP-008", name: "Nasser Al-Qahtani", iqama: "2400001241", mobile: "+966501234574", department: "Logistics", company: "Gulf Industrial Co", status: "active", roomId: null },
    { employeeIdNo: "EMP-009", name: "Tariq Abdullah", iqama: "2400001242", mobile: "+966501234575", department: "Finance", company: "Saudi Services Ltd", status: "inactive", roomId: null },
    { employeeIdNo: "EMP-010", name: "Saad Al-Harbi", iqama: "2400001243", mobile: "+966501234576", department: "HR", company: "Al Rajhi Construction", status: "active", roomId: createdRooms[1].id },
  ];

  for (const emp of employeesData) {
    await storage.createEmployee(emp);
  }

  console.log("Database seeded successfully!");
}
