import { eq, sql, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  portaCabins,
  rooms,
  employees,
  transferLogs,
  exportLogs,
  type User,
  type InsertUser,
  type PortaCabin,
  type InsertPortaCabin,
  type Room,
  type InsertRoom,
  type Employee,
  type InsertEmployee,
  type TransferLog,
  type InsertTransferLog,
  type ExportLog,
  type InsertExportLog,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  getPortaCabin(id: number): Promise<PortaCabin | undefined>;
  getAllPortaCabins(): Promise<PortaCabin[]>;
  createPortaCabin(cabin: InsertPortaCabin): Promise<PortaCabin>;
  updatePortaCabin(id: number, cabin: Partial<InsertPortaCabin>): Promise<PortaCabin | undefined>;
  deletePortaCabin(id: number): Promise<void>;
  getRoomsByPortaCabin(cabinId: number): Promise<Room[]>;

  getRoom(id: number): Promise<Room | undefined>;
  getRoomByHash(hash: string): Promise<Room | undefined>;
  getAllRooms(): Promise<Room[]>;
  createRoom(room: InsertRoom & { qrHash: string }): Promise<Room>;
  updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<void>;

  getEmployee(id: number): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  getEmployeesByRoom(roomId: number): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<void>;
  countEmployeesInRoom(roomId: number): Promise<number>;

  createTransferLog(log: InsertTransferLog): Promise<TransferLog>;
  getRecentTransfers(limit: number): Promise<TransferLog[]>;

  createExportLog(log: InsertExportLog): Promise<ExportLog>;

  getDashboardStats(): Promise<{
    totalEmployees: number;
    totalCabins: number;
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    occupancyRate: number;
    recentTransfers: any[];
    cabinBreakdown: Array<{
      id: number;
      name: string;
      location: string | null;
      status: string;
      totalRooms: number;
      occupiedRooms: number;
      availableRooms: number;
      maintenanceRooms: number;
    }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(exportLogs).where(eq(exportLogs.userId, id));
    await db.delete(transferLogs).where(eq(transferLogs.transferredBy, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async getPortaCabin(id: number): Promise<PortaCabin | undefined> {
    const [cabin] = await db.select().from(portaCabins).where(eq(portaCabins.id, id));
    return cabin;
  }

  async getAllPortaCabins(): Promise<PortaCabin[]> {
    return db.select().from(portaCabins).orderBy(portaCabins.name);
  }

  async createPortaCabin(cabin: InsertPortaCabin): Promise<PortaCabin> {
    const [created] = await db.insert(portaCabins).values(cabin).returning();
    return created;
  }

  async updatePortaCabin(id: number, data: Partial<InsertPortaCabin>): Promise<PortaCabin | undefined> {
    const [updated] = await db.update(portaCabins).set(data).where(eq(portaCabins.id, id)).returning();
    return updated;
  }

  async deletePortaCabin(id: number): Promise<void> {
    await db.update(rooms).set({ portaCabinId: null }).where(eq(rooms.portaCabinId, id));
    await db.delete(portaCabins).where(eq(portaCabins.id, id));
  }

  async getRoomsByPortaCabin(cabinId: number): Promise<Room[]> {
    return db.select().from(rooms).where(eq(rooms.portaCabinId, cabinId));
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async getRoomByHash(hash: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.qrHash, hash));
    return room;
  }

  async getAllRooms(): Promise<Room[]> {
    return db.select().from(rooms);
  }

  async createRoom(room: InsertRoom & { qrHash: string }): Promise<Room> {
    const [created] = await db.insert(rooms).values(room).returning();
    return created;
  }

  async updateRoom(id: number, data: Partial<InsertRoom>): Promise<Room | undefined> {
    const [updated] = await db.update(rooms).set(data).where(eq(rooms.id, id)).returning();
    return updated;
  }

  async deleteRoom(id: number): Promise<void> {
    await db.delete(transferLogs).where(
      sql`${transferLogs.fromRoomId} = ${id} OR ${transferLogs.toRoomId} = ${id}`
    );
    await db.delete(rooms).where(eq(rooms.id, id));
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [emp] = await db.select().from(employees).where(eq(employees.id, id));
    return emp;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return db.select().from(employees);
  }

  async getEmployeesByRoom(roomId: number): Promise<Employee[]> {
    return db.select().from(employees).where(eq(employees.roomId, roomId));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [created] = await db.insert(employees).values(employee).returning();
    return created;
  }

  async updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updated] = await db.update(employees).set(data).where(eq(employees.id, id)).returning();
    return updated;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(transferLogs).where(eq(transferLogs.employeeId, id));
    await db.delete(employees).where(eq(employees.id, id));
  }

  async countEmployeesInRoom(roomId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(eq(employees.roomId, roomId));
    return result[0]?.count ?? 0;
  }

  async createTransferLog(log: InsertTransferLog): Promise<TransferLog> {
    const [created] = await db.insert(transferLogs).values(log).returning();
    return created;
  }

  async getRecentTransfers(limit: number): Promise<TransferLog[]> {
    return db.select().from(transferLogs).orderBy(desc(transferLogs.transferredAt)).limit(limit);
  }

  async createExportLog(log: InsertExportLog): Promise<ExportLog> {
    const [created] = await db.insert(exportLogs).values(log).returning();
    return created;
  }

  async getDashboardStats() {
    const allEmployees = await db.select({ count: sql<number>`count(*)::int` }).from(employees);
    const allCabinsRows = await db.select().from(portaCabins).orderBy(portaCabins.name);
    const allCabins = [{ count: allCabinsRows.length }];
    const allRoomsRows = await db.select().from(rooms);
    const allRooms = [{ count: allRoomsRows.length }];

    const cabinBreakdown = allCabinsRows.map((cabin) => {
      const cabinRooms = allRoomsRows.filter(r => r.portaCabinId === cabin.id);
      return {
        id: cabin.id,
        name: cabin.name,
        location: cabin.location,
        status: cabin.status,
        totalRooms: cabinRooms.length,
        occupiedRooms: cabinRooms.filter(r => r.status === "occupied").length,
        availableRooms: cabinRooms.filter(r => r.status === "available").length,
        maintenanceRooms: cabinRooms.filter(r => r.status === "maintenance").length,
      };
    });

    const occupied = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rooms)
      .where(eq(rooms.status, "occupied"));
    const available = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rooms)
      .where(eq(rooms.status, "available"));

    const totalRooms = allRoomsRows.length;
    const occupiedRooms = occupied[0]?.count ?? 0;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const recentTransferRows = await db
      .select()
      .from(transferLogs)
      .orderBy(desc(transferLogs.transferredAt))
      .limit(5);

    const recentTransfers = await Promise.all(
      recentTransferRows.map(async (t) => {
        const emp = await this.getEmployee(t.employeeId);
        const fromRoom = t.fromRoomId ? await this.getRoom(t.fromRoomId) : null;
        const toRoom = t.toRoomId ? await this.getRoom(t.toRoomId) : null;
        return {
          ...t,
          employeeName: emp?.name ?? "Unknown",
          fromRoom: fromRoom?.roomNumber ?? null,
          toRoom: toRoom?.roomNumber ?? null,
        };
      })
    );

    return {
      totalEmployees: allEmployees[0]?.count ?? 0,
      totalCabins: allCabins[0]?.count ?? 0,
      totalRooms,
      occupiedRooms,
      availableRooms: available[0]?.count ?? 0,
      occupancyRate,
      recentTransfers,
      cabinBreakdown,
    };
  }
}

export const storage = new DatabaseStorage();
