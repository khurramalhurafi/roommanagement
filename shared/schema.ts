import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("hr"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomNumber: text("room_number").notNull().unique(),
  building: text("building").notNull(),
  floor: text("floor").notNull(),
  capacity: integer("capacity").notNull().default(4),
  status: text("status").notNull().default("available"),
  qrHash: text("qr_hash").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeIdNo: text("employee_id_no").notNull().unique(),
  name: text("name").notNull(),
  iqama: text("iqama").notNull(),
  mobile: text("mobile").notNull(),
  department: text("department").notNull(),
  company: text("company").notNull(),
  profileImage: text("profile_image"),
  status: text("status").notNull().default("active"),
  roomId: integer("room_id").references(() => rooms.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transferLogs = pgTable("transfer_logs", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  fromRoomId: integer("from_room_id").references(() => rooms.id),
  toRoomId: integer("to_room_id").references(() => rooms.id),
  transferredAt: timestamp("transferred_at").defaultNow(),
  transferredBy: integer("transferred_by").references(() => users.id),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true, createdAt: true, qrHash: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true });
export const insertTransferLogSchema = createInsertSchema(transferLogs).omit({ id: true, transferredAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertTransferLog = z.infer<typeof insertTransferLogSchema>;
export type TransferLog = typeof transferLogs.$inferSelect;
