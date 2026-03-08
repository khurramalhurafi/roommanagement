import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import multer from "multer";
import pg from "pg";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { z } from "zod";
import { insertEmployeeSchema, insertRoomSchema, insertUserSchema, insertPortaCabinSchema } from "@shared/schema";
import { storage } from "./storage";

const sessionPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const uploadsDir = path.join(process.cwd(), "client", "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG and PNG images are allowed"));
    }
  },
});

const PgSession = ConnectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const express = (await import("express")).default;
  app.use("/uploads", express.static(uploadsDir));

  app.use(
    session({
      store: new PgSession({
        pool: sessionPool,
        createTableIfMissing: false,
        tableName: "session",
      }),
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    })
  );

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.status !== "active") {
        return res.status(401).json({ message: "Account is inactive" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Porta Cabin routes
  app.get("/api/porta-cabins", requireAuth, async (req, res) => {
    try {
      const cabins = await storage.getAllPortaCabins();
      res.json(cabins);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/porta-cabins", requireAuth, async (req, res) => {
    try {
      const parsed = insertPortaCabinSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
      }
      const cabin = await storage.createPortaCabin(parsed.data);
      res.status(201).json(cabin);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/porta-cabins/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const cabin = await storage.updatePortaCabin(id, req.body);
      if (!cabin) return res.status(404).json({ message: "Porta cabin not found" });
      res.json(cabin);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/porta-cabins/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const cabinRooms = await storage.getRoomsByPortaCabin(id);
      const activeRooms = cabinRooms.filter(r => r.status === "occupied");
      if (activeRooms.length > 0) {
        return res.status(400).json({ message: "Cannot delete cabin with occupied rooms" });
      }
      await storage.deletePortaCabin(id);
      res.json({ message: "Deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/porta-cabins/:id/rooms", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const rooms = await storage.getRoomsByPortaCabin(id);
      res.json(rooms);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Employee routes
  app.get("/api/employees", requireAuth, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/employees", requireAuth, async (req, res) => {
    try {
      const parsed = insertEmployeeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
      }
      const { roomId, ...data } = parsed.data;
      if (roomId) {
        const room = await storage.getRoom(roomId);
        if (!room) return res.status(400).json({ message: "Room not found" });
        const count = await storage.countEmployeesInRoom(roomId);
        if (count >= room.capacity) {
          return res.status(400).json({ message: "Room is at full capacity" });
        }
      }
      const employee = await storage.createEmployee({ ...data, roomId: roomId || null });

      if (roomId) {
        await storage.updateRoom(roomId, { status: "occupied" });
      }

      res.status(201).json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/employees/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const employee = await storage.updateEmployee(id, req.body);
      if (!employee) return res.status(404).json({ message: "Employee not found" });
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/employees/:id/upload-photo", requireAuth, upload.single("photo"), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const employee = await storage.getEmployee(id);
      if (!employee) return res.status(404).json({ message: "Employee not found" });

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (employee.profileImage) {
        const oldPath = path.join(uploadsDir, path.basename(employee.profileImage));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      const profileImage = `/uploads/${req.file.filename}`;
      const updated = await storage.updateEmployee(id, { profileImage });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/employees/:id/photo", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const employee = await storage.getEmployee(id);
      if (!employee) return res.status(404).json({ message: "Employee not found" });

      if (employee.profileImage) {
        const oldPath = path.join(uploadsDir, path.basename(employee.profileImage));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      const updated = await storage.updateEmployee(id, { profileImage: null });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/employees/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const employee = await storage.getEmployee(id);
      if (!employee) return res.status(404).json({ message: "Employee not found" });

      if (employee.roomId) {
        const count = await storage.countEmployeesInRoom(employee.roomId);
        if (count <= 1) {
          await storage.updateRoom(employee.roomId, { status: "available" });
        }
      }

      await storage.deleteEmployee(id);
      res.json({ message: "Deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/employees/:id/transfer", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { roomId: newRoomId } = req.body;

      const employee = await storage.getEmployee(id);
      if (!employee) return res.status(404).json({ message: "Employee not found" });

      if (newRoomId) {
        const room = await storage.getRoom(newRoomId);
        if (!room) return res.status(400).json({ message: "Room not found" });
        const count = await storage.countEmployeesInRoom(newRoomId);
        if (employee.roomId !== newRoomId && count >= room.capacity) {
          return res.status(400).json({ message: "Target room is at full capacity" });
        }
      }

      const oldRoomId = employee.roomId;

      await storage.updateEmployee(id, { roomId: newRoomId || null });

      await storage.createTransferLog({
        employeeId: id,
        fromRoomId: oldRoomId || null,
        toRoomId: newRoomId || null,
        transferredBy: req.session.userId!,
      });

      if (oldRoomId) {
        const oldCount = await storage.countEmployeesInRoom(oldRoomId);
        await storage.updateRoom(oldRoomId, { status: oldCount > 0 ? "occupied" : "available" });
      }

      if (newRoomId) {
        await storage.updateRoom(newRoomId, { status: "occupied" });
      }

      res.json({ message: "Transfer successful" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Room routes
  app.get("/api/rooms", requireAuth, async (req, res) => {
    try {
      const rooms = await storage.getAllRooms();
      res.json(rooms);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/rooms", requireAuth, async (req, res) => {
    try {
      const parsed = insertRoomSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
      }
      const qrHash = crypto.randomBytes(16).toString("hex");
      const room = await storage.createRoom({ ...parsed.data, qrHash });
      res.status(201).json(room);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/rooms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const room = await storage.updateRoom(id, req.body);
      if (!room) return res.status(404).json({ message: "Room not found" });
      res.json(room);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/rooms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const emps = await storage.getEmployeesByRoom(id);
      if (emps.length > 0) {
        return res.status(400).json({ message: "Cannot delete room with assigned employees" });
      }
      await storage.deleteRoom(id);
      res.json({ message: "Deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/rooms/:id/employees", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const emps = await storage.getEmployeesByRoom(id);
      res.json(emps);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/rooms/:id/qr", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const room = await storage.getRoom(id);
      if (!room) return res.status(404).json({ message: "Room not found" });

      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
      const host = req.headers.host;
      const url = `${protocol === "https" || process.env.NODE_ENV === "production" ? "https" : protocol}://${host}/room/${room.qrHash}`;
      const qrDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
      res.json({ qrDataUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/public/room/:hash", async (req, res) => {
    try {
      const room = await storage.getRoomByHash(req.params.hash);
      if (!room) return res.status(404).json({ message: "Room not found" });

      const emps = await storage.getEmployeesByRoom(room.id);
      const safeEmployees = emps.map(({ iqama, mobile, ...rest }) => rest);

      let portaCabin = null;
      if (room.portaCabinId) {
        portaCabin = await storage.getPortaCabin(room.portaCabinId);
      }

      res.json({ room, employees: safeEmployees, portaCabin });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User management routes
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(({ password, ...rest }) => rest);
      res.json(safeUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
      }
      const { password, ...data } = parsed.data;
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ ...data, password: hashedPassword });
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { password, ...data } = req.body;
      let updateData: any = data;
      if (password && password.length > 0) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      const user = await storage.updateUser(id, updateData);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (id === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      await storage.deleteUser(id);
      res.json({ message: "Deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  async function logExport(userId: number, exportType: string, format: string) {
    await storage.createExportLog({ userId, exportType, format });
  }

  const getExportSummary = (allEmployees: any[], allRooms: any[], allCabins: any[]) => {
    const occupiedRoomIds = new Set(allEmployees.filter(e => e.roomId !== null).map(e => e.roomId));
    return {
      totalEmployees: allEmployees.length,
      totalCabins: allCabins.length,
      totalRooms: allRooms.length,
      occupiedRooms: occupiedRoomIds.size,
      availableRooms: allRooms.filter(r => r.status === "available").length,
    };
  };

  const applyFilters = (employees: any[], rooms: any[], cabins: any[], query: any) => {
    const department = query.department as string | undefined;
    const company = query.company as string | undefined;
    const roomId = query.roomId as string | undefined;
    const cabinId = query.cabinId as string | undefined;
    const status = query.status as string | undefined;

    let filteredEmployees = employees;
    let filteredRooms = rooms;
    let filteredCabins = cabins;

    if (cabinId) filteredCabins = filteredCabins.filter((c: any) => c.id === parseInt(cabinId));
    if (cabinId) filteredRooms = filteredRooms.filter((r: any) => r.portaCabinId === parseInt(cabinId));
    if (roomId) filteredRooms = filteredRooms.filter((r: any) => r.id === parseInt(roomId));
    if (status) filteredRooms = filteredRooms.filter((r: any) => r.status === status);

    if (department) filteredEmployees = filteredEmployees.filter((e: any) => e.department === department);
    if (company) filteredEmployees = filteredEmployees.filter((e: any) => e.company === company);

    const filteredRoomIds = new Set(filteredRooms.map((r: any) => r.id));
    if (cabinId || roomId || status) {
      filteredEmployees = filteredEmployees.filter((e: any) => e.roomId !== null && filteredRoomIds.has(e.roomId));
    }

    return { filteredEmployees, filteredRooms, filteredCabins };
  };

  app.get("/api/export/employees/excel", requireAuth, async (req, res) => {
    try {
      const allEmployees = await storage.getAllEmployees();
      const allRooms = await storage.getAllRooms();
      const allCabins = await storage.getAllPortaCabins();
      const user = await storage.getUser(req.session.userId!);
      const roomMap = new Map(allRooms.map(r => [r.id, r.roomNumber]));
      const cabinMap = new Map(allCabins.map(c => [c.id, c.name]));
      const roomCabinMap = new Map(allRooms.map(r => [r.id, r.portaCabinId ? cabinMap.get(r.portaCabinId) || "—" : (r.building || "—")]));

      const { filteredEmployees, filteredRooms } = applyFilters(allEmployees, allRooms, allCabins, req.query);
      const summary = getExportSummary(filteredEmployees, filteredRooms, allCabins);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "EAM System";
      workbook.created = new Date();
      const sheet = workbook.addWorksheet("Employees");

      const summaryStyle = { font: { bold: true, size: 11 } };
      const titleStyle = { font: { bold: true, size: 14, color: { argb: "FF2563EB" } } };

      sheet.mergeCells("A1:J1");
      sheet.getCell("A1").value = "Employee Accommodation Report";
      sheet.getCell("A1").font = titleStyle.font;
      sheet.getCell("A2").value = `Generated By: ${user?.name || "System"}`;
      sheet.getCell("A2").font = summaryStyle.font;
      sheet.getCell("A3").value = `Generated On: ${new Date().toLocaleString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;
      sheet.getCell("A3").font = summaryStyle.font;
      sheet.getCell("A4").value = `Total Employees: ${summary.totalEmployees}`;
      sheet.getCell("A4").font = summaryStyle.font;
      sheet.getCell("A5").value = `Total Cabins: ${summary.totalCabins} | Total Rooms: ${summary.totalRooms}`;
      sheet.getCell("A5").font = summaryStyle.font;
      sheet.getCell("A6").value = `Occupied Rooms: ${summary.occupiedRooms} | Available Rooms: ${summary.availableRooms}`;
      sheet.getCell("A6").font = summaryStyle.font;
      sheet.addRow([]);

      const tableHeaderRow = 8;
      const headers = ["Employee ID", "Name", "Iqama", "Mobile", "Department", "Company", "Porta Cabin", "Room No", "Status"];
      const widths = [15, 25, 15, 18, 20, 25, 18, 12, 12];
      headers.forEach((h, i) => {
        const cell = sheet.getCell(tableHeaderRow, i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
        cell.alignment = { horizontal: "center" };
        sheet.getColumn(i + 1).width = widths[i];
      });

      filteredEmployees.forEach((emp) => {
        sheet.addRow([
          emp.employeeIdNo,
          emp.name,
          emp.iqama,
          emp.mobile,
          emp.department,
          emp.company,
          emp.roomId ? roomCabinMap.get(emp.roomId) || "—" : "—",
          emp.roomId ? roomMap.get(emp.roomId) || "N/A" : "Unassigned",
          emp.status,
        ]);
      });

      sheet.addRow([]);
      sheet.addRow([`Total Employees: ${filteredEmployees.length}`]).font = { bold: true };

      await logExport(req.session.userId!, "employee", "excel");

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=employees_${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/export/employees/pdf", requireAuth, async (req, res) => {
    try {
      const allEmployees = await storage.getAllEmployees();
      const allRooms = await storage.getAllRooms();
      const allCabins = await storage.getAllPortaCabins();
      const user = await storage.getUser(req.session.userId!);
      const roomMap = new Map(allRooms.map(r => [r.id, r.roomNumber]));
      const cabinMap = new Map(allCabins.map(c => [c.id, c.name]));
      const roomCabinMap = new Map(allRooms.map(r => [r.id, r.portaCabinId ? cabinMap.get(r.portaCabinId) || "—" : (r.building || "—")]));

      const { filteredEmployees, filteredRooms } = applyFilters(allEmployees, allRooms, allCabins, req.query);
      const summary = getExportSummary(filteredEmployees, filteredRooms, allCabins);

      const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape", bufferPages: true });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=employees_${Date.now()}.pdf`);
      doc.pipe(res);

      doc.fontSize(20).font("Helvetica-Bold").fillColor("#2563EB").text("Employee Accommodation Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").fillColor("black");
      doc.text(`Generated By: ${user?.name || "System"}`, { align: "center" });
      doc.text(`Generated On: ${new Date().toLocaleString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, { align: "center" });
      doc.moveDown(0.5);

      doc.rect(40, doc.y, 760, 55).fill("#F1F5F9");
      const summaryY = doc.y + 8;
      doc.fillColor("black").font("Helvetica-Bold").fontSize(9);
      doc.text(`Total Employees: ${summary.totalEmployees}`, 60, summaryY);
      doc.text(`Total Cabins: ${summary.totalCabins}`, 220, summaryY);
      doc.text(`Total Rooms: ${summary.totalRooms}`, 380, summaryY);
      doc.text(`Occupied Rooms: ${summary.occupiedRooms}`, 540, summaryY);
      doc.text(`Available Rooms: ${summary.availableRooms}`, 660, summaryY);
      doc.y = summaryY + 45;
      doc.moveDown(0.5);

      const headers = ["Photo", "ID", "Name", "Department", "Company", "Cabin", "Room", "Status"];
      const colWidths = [45, 60, 120, 90, 120, 100, 65, 60];
      const tableLeft = 40;
      const tableWidth = colWidths.reduce((a, b) => a + b, 0);
      let y = doc.y;

      const drawTableHeader = (yPos: number) => {
        doc.font("Helvetica-Bold").fontSize(8);
        doc.rect(tableLeft, yPos, tableWidth, 20).fill("#2563EB");
        let x = tableLeft;
        headers.forEach((h, i) => {
          doc.fillColor("white").text(h, x + 3, yPos + 5, { width: colWidths[i] - 6 });
          x += colWidths[i];
        });
        doc.fillColor("black");
        return yPos + 20;
      };

      y = drawTableHeader(y);

      doc.font("Helvetica").fontSize(7);
      for (let idx = 0; idx < filteredEmployees.length; idx++) {
        const emp = filteredEmployees[idx];
        const rowHeight = 36;
        if (y > 510) {
          doc.addPage();
          y = 40;
          y = drawTableHeader(y);
          doc.font("Helvetica").fontSize(7);
        }
        const bgColor = idx % 2 === 0 ? "#F8FAFC" : "#FFFFFF";
        doc.rect(tableLeft, y, tableWidth, rowHeight).fill(bgColor);
        doc.fillColor("black");

        let x = tableLeft;

        if (emp.profileImage) {
          const imgPath = path.join(uploadsDir, path.basename(emp.profileImage));
          if (fs.existsSync(imgPath)) {
            try {
              doc.image(imgPath, x + 3, y + 3, { width: 30, height: 30 });
            } catch (_) {}
          }
        }
        x += colWidths[0];

        const row = [
          emp.employeeIdNo,
          emp.name,
          emp.department,
          emp.company,
          emp.roomId ? roomCabinMap.get(emp.roomId) || "—" : "—",
          emp.roomId ? roomMap.get(emp.roomId) || "N/A" : "—",
          emp.status,
        ];
        row.forEach((cell, i) => {
          doc.text(String(cell), x + 3, y + 14, { width: colWidths[i + 1] - 6 });
          x += colWidths[i + 1];
        });
        y += rowHeight;
      }

      const pageRange = doc.bufferedPageRange();
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor("#666666");
        doc.text(`Page ${i + 1} of ${pageRange.count}`, 350, 560, { align: "center" });
        doc.text("Employee Accommodation Management System", 40, 560);
      }

      await logExport(req.session.userId!, "employee", "pdf");
      doc.end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/export/rooms/excel", requireAuth, async (req, res) => {
    try {
      const allRooms = await storage.getAllRooms();
      const allEmployees = await storage.getAllEmployees();
      const allCabins = await storage.getAllPortaCabins();
      const user = await storage.getUser(req.session.userId!);
      const cabinMap = new Map(allCabins.map(c => [c.id, c.name]));

      const { filteredEmployees, filteredRooms, filteredCabins } = applyFilters(allEmployees, allRooms, allCabins, req.query);
      const summary = getExportSummary(filteredEmployees, filteredRooms, filteredCabins);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "EAM System";
      workbook.created = new Date();
      const sheet = workbook.addWorksheet("Room Details");

      const titleStyle = { font: { bold: true, size: 14, color: { argb: "FF2563EB" } } };
      const summaryBold = { font: { bold: true, size: 11 } };

      sheet.mergeCells("A1:F1");
      sheet.getCell("A1").value = "Room Accommodation Report";
      sheet.getCell("A1").font = titleStyle.font;
      sheet.getCell("A2").value = `Generated By: ${user?.name || "System"}`;
      sheet.getCell("A2").font = summaryBold.font;
      sheet.getCell("A3").value = `Generated On: ${new Date().toLocaleString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;
      sheet.getCell("A3").font = summaryBold.font;
      sheet.getCell("A4").value = `Total Cabins: ${summary.totalCabins} | Total Rooms: ${summary.totalRooms} | Total Employees: ${summary.totalEmployees}`;
      sheet.getCell("A4").font = summaryBold.font;
      sheet.getCell("A5").value = `Occupied Rooms: ${summary.occupiedRooms} | Available Rooms: ${summary.availableRooms}`;
      sheet.getCell("A5").font = summaryBold.font;

      let currentRow = 7;
      ["A", "B", "C", "D", "E", "F"].forEach((col, i) => {
        sheet.getColumn(col).width = [15, 25, 20, 20, 12, 15][i];
      });

      const cabinsToShow = filteredCabins.length > 0 ? filteredCabins : allCabins;
      const roomsWithNoCabin = filteredRooms.filter(r => !r.portaCabinId);

      for (const cabin of cabinsToShow) {
        const cabinRooms = filteredRooms.filter(r => r.portaCabinId === cabin.id);
        if (cabinRooms.length === 0) continue;

        sheet.mergeCells(`A${currentRow}:F${currentRow}`);
        const cabinRow = sheet.getRow(currentRow);
        cabinRow.getCell(1).value = `Porta Cabin: ${cabin.name}${cabin.location ? ` (${cabin.location})` : ""}`;
        cabinRow.getCell(1).font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
        cabinRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
        currentRow++;

        for (const room of cabinRooms) {
          const roomEmployees = filteredEmployees.filter(e => e.roomId === room.id);

          sheet.mergeCells(`A${currentRow}:F${currentRow}`);
          const roomHeaderRow = sheet.getRow(currentRow);
          roomHeaderRow.getCell(1).value = `Room ${room.roomNumber}${room.floor ? ` (Floor ${room.floor})` : ""}`;
          roomHeaderRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FF2563EB" } };
          roomHeaderRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
          currentRow++;

          sheet.getCell(`A${currentRow}`).value = `Capacity: ${room.capacity}`;
          sheet.getCell(`B${currentRow}`).value = `Occupied: ${roomEmployees.length}`;
          sheet.getCell(`C${currentRow}`).value = `Status: ${room.status}`;
          sheet.getRow(currentRow).font = { size: 10 };
          currentRow++;

          if (roomEmployees.length > 0) {
            const empHeaders = ["Employee ID", "Name", "Department", "Company", "Status"];
            empHeaders.forEach((h, i) => {
              const cell = sheet.getCell(currentRow, i + 1);
              cell.value = h;
              cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475569" } };
            });
            currentRow++;

            roomEmployees.forEach(emp => {
              sheet.getRow(currentRow).values = [emp.employeeIdNo, emp.name, emp.department, emp.company, emp.status];
              currentRow++;
            });
          } else {
            sheet.getCell(`A${currentRow}`).value = "No employees assigned to this room.";
            sheet.getCell(`A${currentRow}`).font = { italic: true, color: { argb: "FF999999" } };
            currentRow++;
          }

          currentRow++;
        }
        currentRow++;
      }

      if (roomsWithNoCabin.length > 0) {
        sheet.mergeCells(`A${currentRow}:F${currentRow}`);
        const otherRow = sheet.getRow(currentRow);
        otherRow.getCell(1).value = "Unassigned Rooms";
        otherRow.getCell(1).font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
        otherRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475569" } };
        currentRow++;

        for (const room of roomsWithNoCabin) {
          const roomEmployees = filteredEmployees.filter(e => e.roomId === room.id);
          sheet.mergeCells(`A${currentRow}:F${currentRow}`);
          sheet.getRow(currentRow).getCell(1).value = `Room ${room.roomNumber}`;
          sheet.getRow(currentRow).getCell(1).font = { bold: true, size: 11, color: { argb: "FF2563EB" } };
          sheet.getRow(currentRow).getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
          currentRow++;

          if (roomEmployees.length > 0) {
            roomEmployees.forEach(emp => {
              sheet.getRow(currentRow).values = [emp.employeeIdNo, emp.name, emp.department, emp.company, emp.status];
              currentRow++;
            });
          } else {
            sheet.getCell(`A${currentRow}`).value = "No employees assigned.";
            sheet.getCell(`A${currentRow}`).font = { italic: true, color: { argb: "FF999999" } };
            currentRow++;
          }
          currentRow++;
        }
      }

      await logExport(req.session.userId!, "room", "excel");

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=rooms_${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/export/rooms/pdf", requireAuth, async (req, res) => {
    try {
      const allRooms = await storage.getAllRooms();
      const allEmployees = await storage.getAllEmployees();
      const allCabins = await storage.getAllPortaCabins();
      const user = await storage.getUser(req.session.userId!);
      const cabinMap = new Map(allCabins.map(c => [c.id, c.name]));

      const { filteredEmployees, filteredRooms, filteredCabins } = applyFilters(allEmployees, allRooms, allCabins, req.query);
      const summary = getExportSummary(filteredEmployees, filteredRooms, filteredCabins);

      const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=rooms_${Date.now()}.pdf`);
      doc.pipe(res);

      doc.fontSize(20).font("Helvetica-Bold").fillColor("#2563EB").text("Room Accommodation Report", { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica").fillColor("black");
      doc.text(`Generated By: ${user?.name || "System"}`, { align: "center" });
      doc.text(`Generated On: ${new Date().toLocaleString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, { align: "center" });
      doc.moveDown(0.5);

      doc.rect(40, doc.y, 515, 55).fill("#F1F5F9");
      const sy = doc.y + 8;
      doc.fillColor("black").font("Helvetica-Bold").fontSize(9);
      doc.text(`Total Cabins: ${summary.totalCabins}`, 60, sy);
      doc.text(`Total Rooms: ${summary.totalRooms}`, 60, sy + 16);
      doc.text(`Total Employees: ${summary.totalEmployees}`, 200, sy);
      doc.text(`Occupied Rooms: ${summary.occupiedRooms}`, 200, sy + 16);
      doc.text(`Available Rooms: ${summary.availableRooms}`, 350, sy);
      doc.y = sy + 55;
      doc.moveDown(0.5);

      const cabinsToShow = filteredCabins.length > 0 ? filteredCabins : allCabins;
      const roomsWithNoCabin = filteredRooms.filter(r => !r.portaCabinId);

      const printRooms = (roomList: any[]) => {
        roomList.forEach((room, rIdx) => {
          const roomEmployees = filteredEmployees.filter(e => e.roomId === room.id);
          const neededHeight = 80 + (roomEmployees.length > 0 ? 20 + roomEmployees.length * 16 : 20);

          if (doc.y + neededHeight > 720) {
            doc.addPage();
          }

          doc.rect(40, doc.y, 515, 24).fill("#2563EB");
          doc.fillColor("white").font("Helvetica-Bold").fontSize(11).text(
            `ROOM: ${room.roomNumber}${room.floor ? ` — Floor ${room.floor}` : ""}`,
            50, doc.y + 5, { continued: false }
          );
          doc.y += 5;

          doc.fillColor("black").font("Helvetica").fontSize(9);
          doc.text(`Cabin: ${room.portaCabinId ? cabinMap.get(room.portaCabinId) || "—" : (room.building || "—")}    |    Capacity: ${room.capacity}    |    Occupied: ${roomEmployees.length}    |    Status: ${room.status}`);
          doc.moveDown(0.3);

          if (roomEmployees.length > 0) {
            doc.rect(40, doc.y, 515, 2).fill("#E2E8F0");
            doc.y += 5;
            doc.font("Helvetica-Bold").fontSize(9).fillColor("black").text("Employee List:");
            doc.moveDown(0.2);

            roomEmployees.forEach(emp => {
              doc.font("Helvetica").fontSize(8).fillColor("#334155");
              doc.text(`  \u2022  ${emp.name} — ID: ${emp.employeeIdNo} — ${emp.department} — ${emp.company}`);
            });
          } else {
            doc.font("Helvetica").fontSize(8).fillColor("#999999").text("  No employees assigned to this room.");
          }

          doc.fillColor("black");
          doc.moveDown(0.8);
        });
      };

      for (const cabin of cabinsToShow) {
        const cabinRooms = filteredRooms.filter(r => r.portaCabinId === cabin.id);
        if (cabinRooms.length === 0) continue;

        if (doc.y > 650) doc.addPage();

        doc.rect(40, doc.y, 515, 26).fill("#1E3A5F");
        doc.fillColor("white").font("Helvetica-Bold").fontSize(13).text(
          `Porta Cabin: ${cabin.name}${cabin.location ? ` (${cabin.location})` : ""}`,
          50, doc.y + 5
        );
        doc.y += 10;
        doc.moveDown(0.5);

        printRooms(cabinRooms);
      }

      if (roomsWithNoCabin.length > 0) {
        if (doc.y > 650) doc.addPage();
        doc.rect(40, doc.y, 515, 26).fill("#475569");
        doc.fillColor("white").font("Helvetica-Bold").fontSize(13).text("Unassigned Rooms", 50, doc.y + 5);
        doc.y += 10;
        doc.moveDown(0.5);
        printRooms(roomsWithNoCabin);
      }

      const pageRange = doc.bufferedPageRange();
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor("#666666");
        doc.text(`Page ${i + 1} of ${pageRange.count}`, 250, 790, { align: "center" });
        doc.text("Employee Accommodation Management System", 40, 790);
      }

      await logExport(req.session.userId!, "room", "pdf");
      doc.end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/export/rooms/qr-pdf", requireAuth, async (req, res) => {
    try {
      const allRooms = await storage.getAllRooms();
      const allEmployees = await storage.getAllEmployees();
      const allCabins = await storage.getAllPortaCabins();
      const layout = (req.query.layout as string) || "single";
      const cabinMap = new Map(allCabins.map(c => [c.id, c.name]));

      const { filteredRooms } = applyFilters(allEmployees, allRooms, allCabins, req.query);

      const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=room_qr_codes_${Date.now()}.pdf`);
      doc.pipe(res);

      if (layout === "grid") {
        const perPage = 4;
        const qrSize = 200;
        const positions = [
          { x: 60, y: 0 },
          { x: 320, y: 0 },
          { x: 60, y: 370 },
          { x: 320, y: 370 },
        ];

        const startY = doc.y;

        for (let i = 0; i < filteredRooms.length; i++) {
          const room = filteredRooms[i];
          const posIdx = i % perPage;
          if (i > 0 && posIdx === 0) doc.addPage();

          const baseY = i < perPage ? startY : 60;
          const pos = { x: positions[posIdx].x, y: baseY + positions[posIdx].y };
          const cabinName = room.portaCabinId ? cabinMap.get(room.portaCabinId) || "" : (room.building || "");
          const qrProtocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
          const baseUrl = `${qrProtocol === "https" || process.env.NODE_ENV === "production" ? "https" : qrProtocol}://${req.get("host")}`;
          const qrUrl = `${baseUrl}/room/${room.qrHash}`;
          const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: qrSize, margin: 1 });
          const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

          if (cabinName) {
            doc.font("Helvetica").fontSize(10).fillColor("#475569").text(cabinName, pos.x, pos.y, { width: qrSize, align: "center" });
          }
          doc.font("Helvetica-Bold").fontSize(14).fillColor("black").text(`ROOM: ${room.roomNumber}`, pos.x, pos.y + (cabinName ? 14 : 0), { width: qrSize, align: "center" });
          doc.image(qrBuffer, pos.x + 25, pos.y + (cabinName ? 36 : 20), { width: qrSize - 50 });
        }
      } else {
        for (let i = 0; i < filteredRooms.length; i++) {
          const room = filteredRooms[i];
          if (i > 0) doc.addPage();

          const cabinName = room.portaCabinId ? cabinMap.get(room.portaCabinId) || "" : (room.building || "");

          if (cabinName) {
            doc.font("Helvetica").fontSize(18).fillColor("#475569").text(cabinName, { align: "center" });
            doc.moveDown(0.3);
          }
          doc.font("Helvetica-Bold").fontSize(28).fillColor("black").text(`ROOM: ${room.roomNumber}`, { align: "center" });
          doc.moveDown(0.5);
          if (room.floor) {
            doc.font("Helvetica").fontSize(14).text(`Floor ${room.floor}`, { align: "center" });
            doc.moveDown(0.3);
          }
          doc.fontSize(12).text(`Capacity: ${room.capacity}`, { align: "center" });
          doc.moveDown(1);

          const qrProtocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
          const baseUrl = `${qrProtocol === "https" || process.env.NODE_ENV === "production" ? "https" : qrProtocol}://${req.get("host")}`;
          const qrUrl = `${baseUrl}/room/${room.qrHash}`;
          const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 400, margin: 1 });
          const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

          doc.image(qrBuffer, (doc.page.width - 300) / 2, doc.y, { width: 300 });
          doc.y += 310;
          doc.fontSize(10).text("Scan to view room details", { align: "center" });
        }
      }

      const pageRange = doc.bufferedPageRange();
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor("#666666");
        doc.text(`Page ${i + 1} of ${pageRange.count}`, 250, 790, { align: "center" });
        doc.text("Employee Accommodation Management System", 40, 790);
      }

      await logExport(req.session.userId!, "qr", "pdf");
      doc.end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
