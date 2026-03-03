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
import { insertEmployeeSchema, insertRoomSchema, insertUserSchema } from "@shared/schema";
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
      const id = parseInt(req.params.id);
      const employee = await storage.updateEmployee(id, req.body);
      if (!employee) return res.status(404).json({ message: "Employee not found" });
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/employees/:id/upload-photo", requireAuth, upload.single("photo"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
      const room = await storage.updateRoom(id, req.body);
      if (!room) return res.status(404).json({ message: "Room not found" });
      res.json(room);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/rooms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
      const emps = await storage.getEmployeesByRoom(id);
      res.json(emps);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/rooms/:id/qr", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.getRoom(id);
      if (!room) return res.status(404).json({ message: "Room not found" });

      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host;
      const url = `${protocol}://${host}/room/${room.qrHash}`;
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

      res.json({ room, employees: safeEmployees });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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

  app.get("/api/export/employees/excel", requireAuth, async (req, res) => {
    try {
      const allEmployees = await storage.getAllEmployees();
      const allRooms = await storage.getAllRooms();
      const roomMap = new Map(allRooms.map(r => [r.id, r.roomNumber]));

      let filtered = allEmployees;
      const department = req.query.department as string | undefined;
      const company = req.query.company as string | undefined;
      const roomId = req.query.roomId as string | undefined;
      const status = req.query.status as string | undefined;
      if (department) filtered = filtered.filter(e => e.department === department);
      if (company) filtered = filtered.filter(e => e.company === company);
      if (roomId) filtered = filtered.filter(e => e.roomId === parseInt(roomId));
      if (status) filtered = filtered.filter(e => e.status === status);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "EAM System";
      workbook.created = new Date();
      const sheet = workbook.addWorksheet("Employees");

      sheet.columns = [
        { header: "Employee ID", key: "employeeIdNo", width: 15 },
        { header: "Name", key: "name", width: 25 },
        { header: "Iqama", key: "iqama", width: 15 },
        { header: "Mobile", key: "mobile", width: 18 },
        { header: "Department", key: "department", width: 20 },
        { header: "Company", key: "company", width: 25 },
        { header: "Room No", key: "roomNo", width: 12 },
        { header: "Status", key: "status", width: 12 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      headerRow.alignment = { horizontal: "center" };

      filtered.forEach(emp => {
        sheet.addRow({
          employeeIdNo: emp.employeeIdNo,
          name: emp.name,
          iqama: emp.iqama,
          mobile: emp.mobile,
          department: emp.department,
          company: emp.company,
          roomNo: emp.roomId ? roomMap.get(emp.roomId) || "N/A" : "Unassigned",
          status: emp.status,
        });
      });

      const footerRow = sheet.addRow([]);
      sheet.addRow([`Generated on: ${new Date().toLocaleString()}`]);
      sheet.addRow([`Total Records: ${filtered.length}`]);

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
      const roomMap = new Map(allRooms.map(r => [r.id, r.roomNumber]));

      let filtered = allEmployees;
      const department = req.query.department as string | undefined;
      const company = req.query.company as string | undefined;
      const roomId = req.query.roomId as string | undefined;
      const status = req.query.status as string | undefined;
      if (department) filtered = filtered.filter(e => e.department === department);
      if (company) filtered = filtered.filter(e => e.company === company);
      if (roomId) filtered = filtered.filter(e => e.roomId === parseInt(roomId));
      if (status) filtered = filtered.filter(e => e.status === status);

      const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=employees_${Date.now()}.pdf`);
      doc.pipe(res);

      doc.fontSize(18).font("Helvetica-Bold").text("Employee List Report", { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(10).text(`Total Records: ${filtered.length}`, { align: "center" });
      doc.moveDown(1);

      const headers = ["ID", "Name", "Iqama", "Mobile", "Department", "Company", "Room", "Status"];
      const colWidths = [55, 110, 80, 90, 85, 110, 60, 55];
      const tableLeft = 40;
      let y = doc.y;

      const drawTableHeader = (yPos: number) => {
        doc.font("Helvetica-Bold").fontSize(8);
        doc.rect(tableLeft, yPos, colWidths.reduce((a, b) => a + b, 0), 20).fill("#2563EB");
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
      filtered.forEach((emp, idx) => {
        if (y > 530) {
          doc.addPage();
          y = 40;
          y = drawTableHeader(y);
          doc.font("Helvetica").fontSize(7);
        }
        const bgColor = idx % 2 === 0 ? "#F8FAFC" : "#FFFFFF";
        doc.rect(tableLeft, y, colWidths.reduce((a, b) => a + b, 0), 18).fill(bgColor);
        doc.fillColor("black");
        const row = [
          emp.employeeIdNo,
          emp.name,
          emp.iqama,
          emp.mobile,
          emp.department,
          emp.company,
          emp.roomId ? roomMap.get(emp.roomId) || "N/A" : "—",
          emp.status,
        ];
        let x = tableLeft;
        row.forEach((cell, i) => {
          doc.text(cell, x + 3, y + 5, { width: colWidths[i] - 6 });
          x += colWidths[i];
        });
        y += 18;
      });

      const pageRange = doc.bufferedPageRange();
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).text(`Page ${i + 1} of ${pageRange.count}`, 40, 560, { align: "center" });
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

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "EAM System";
      workbook.created = new Date();
      const sheet = workbook.addWorksheet("Rooms");

      sheet.columns = [
        { header: "Room No", key: "roomNumber", width: 15 },
        { header: "Building", key: "building", width: 20 },
        { header: "Floor", key: "floor", width: 10 },
        { header: "Capacity", key: "capacity", width: 12 },
        { header: "Occupied", key: "occupied", width: 12 },
        { header: "Status", key: "status", width: 15 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      headerRow.alignment = { horizontal: "center" };

      allRooms.forEach(room => {
        const occupiedCount = allEmployees.filter(e => e.roomId === room.id).length;
        const row = sheet.addRow({
          roomNumber: room.roomNumber,
          building: room.building,
          floor: room.floor,
          capacity: room.capacity,
          occupied: occupiedCount,
          status: room.status,
        });

        if (occupiedCount >= room.capacity) {
          row.getCell("occupied").font = { bold: true, color: { argb: "FFDC2626" } };
        }
      });

      const totalCapacity = allRooms.reduce((sum, r) => sum + r.capacity, 0);
      const totalOccupied = allEmployees.filter(e => e.roomId !== null).length;
      sheet.addRow([]);
      sheet.addRow([`Generated on: ${new Date().toLocaleString()}`]);
      sheet.addRow([`Total Rooms: ${allRooms.length} | Occupancy: ${totalOccupied}/${totalCapacity} (${totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0}%)`]);

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

      const doc = new PDFDocument({ margin: 40, size: "A4" });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=rooms_${Date.now()}.pdf`);
      doc.pipe(res);

      doc.fontSize(18).font("Helvetica-Bold").text("Room List Report", { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });

      const totalCapacity = allRooms.reduce((sum, r) => sum + r.capacity, 0);
      const totalOccupied = allEmployees.filter(e => e.roomId !== null).length;
      const occupancyPct = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
      doc.moveDown(0.3);
      doc.fontSize(10).text(`Total Rooms: ${allRooms.length} | Overall Occupancy: ${occupancyPct}%`, { align: "center" });
      doc.moveDown(1);

      const headers = ["Room No", "Building", "Floor", "Capacity", "Occupied", "Status"];
      const colWidths = [70, 100, 60, 70, 70, 80];
      const tableLeft = 40;
      let y = doc.y;

      const drawHeader = (yPos: number) => {
        doc.font("Helvetica-Bold").fontSize(9);
        doc.rect(tableLeft, yPos, colWidths.reduce((a, b) => a + b, 0), 22).fill("#2563EB");
        let x = tableLeft;
        headers.forEach((h, i) => {
          doc.fillColor("white").text(h, x + 4, yPos + 6, { width: colWidths[i] - 8 });
          x += colWidths[i];
        });
        doc.fillColor("black");
        return yPos + 22;
      };

      y = drawHeader(y);

      doc.font("Helvetica").fontSize(8);
      allRooms.forEach((room, idx) => {
        if (y > 750) {
          doc.addPage();
          y = 40;
          y = drawHeader(y);
          doc.font("Helvetica").fontSize(8);
        }
        const occupiedCount = allEmployees.filter(e => e.roomId === room.id).length;
        const isFull = occupiedCount >= room.capacity;
        const bgColor = isFull ? "#FEF2F2" : idx % 2 === 0 ? "#F8FAFC" : "#FFFFFF";
        doc.rect(tableLeft, y, colWidths.reduce((a, b) => a + b, 0), 20).fill(bgColor);
        doc.fillColor(isFull ? "#DC2626" : "black");
        const row = [room.roomNumber, room.building, room.floor, String(room.capacity), String(occupiedCount), room.status];
        let x = tableLeft;
        row.forEach((cell, i) => {
          doc.text(cell, x + 4, y + 5, { width: colWidths[i] - 8 });
          x += colWidths[i];
        });
        doc.fillColor("black");
        y += 20;
      });

      const pageRange = doc.bufferedPageRange();
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).text(`Page ${i + 1} of ${pageRange.count}`, 40, 780, { align: "center" });
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
      const layout = (req.query.layout as string) || "single";

      const doc = new PDFDocument({ margin: 40, size: "A4" });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=room_qr_codes_${Date.now()}.pdf`);
      doc.pipe(res);

      if (layout === "grid") {
        const perPage = 4;
        const qrSize = 200;
        const positions = [
          { x: 60, y: 80 },
          { x: 320, y: 80 },
          { x: 60, y: 450 },
          { x: 320, y: 450 },
        ];

        for (let i = 0; i < allRooms.length; i++) {
          const room = allRooms[i];
          const posIdx = i % perPage;
          if (i > 0 && posIdx === 0) doc.addPage();

          const pos = positions[posIdx];
          const baseUrl = `${req.protocol}://${req.get("host")}`;
          const qrUrl = `${baseUrl}/room/${room.qrHash}`;
          const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: qrSize, margin: 1 });
          const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

          doc.font("Helvetica-Bold").fontSize(14).text(`ROOM: ${room.roomNumber}`, pos.x, pos.y, { width: qrSize, align: "center" });
          doc.font("Helvetica").fontSize(10).text(`${room.building} - Floor ${room.floor}`, pos.x, pos.y + 20, { width: qrSize, align: "center" });
          doc.image(qrBuffer, pos.x + 25, pos.y + 40, { width: qrSize - 50 });
        }
      } else {
        for (let i = 0; i < allRooms.length; i++) {
          const room = allRooms[i];
          if (i > 0) doc.addPage();

          const baseUrl = `${req.protocol}://${req.get("host")}`;
          const qrUrl = `${baseUrl}/room/${room.qrHash}`;
          const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 400, margin: 1 });
          const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

          doc.moveDown(3);
          doc.font("Helvetica-Bold").fontSize(28).text(`ROOM: ${room.roomNumber}`, { align: "center" });
          doc.moveDown(0.5);
          doc.font("Helvetica").fontSize(16).text(`${room.building} - Floor ${room.floor}`, { align: "center" });
          doc.moveDown(0.5);
          doc.fontSize(12).text(`Capacity: ${room.capacity}`, { align: "center" });
          doc.moveDown(1);
          doc.image(qrBuffer, (doc.page.width - 300) / 2, doc.y, { width: 300 });
          doc.moveDown(1);
          doc.y += 310;
          doc.fontSize(10).text("Scan to view room details", { align: "center" });
        }
      }

      const pageRange = doc.bufferedPageRange();
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).text(`Page ${i + 1} of ${pageRange.count}`, 40, 780, { align: "center" });
      }

      await logExport(req.session.userId!, "qr", "pdf");
      doc.end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
