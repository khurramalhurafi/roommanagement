import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Home,
  MapPin,
  DoorOpen,
  Users,
  Settings,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  UserPlus,
  Printer,
} from "lucide-react";
import type { PortaCabin, Room, Employee } from "@shared/schema";

const cabinFormSchema = z.object({
  name: z.string().min(1, "Cabin name is required"),
  location: z.string().optional(),
  status: z.string().default("active"),
});
type CabinFormData = z.infer<typeof cabinFormSchema>;

const roomFormSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  portaCabinId: z.number().nullable().optional(),
  floor: z.string().optional(),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  status: z.string().default("available"),
});
type RoomFormData = z.infer<typeof roomFormSchema>;

const employeeEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  iqama: z.string().min(1, "Iqama is required"),
  mobile: z.string().min(1, "Mobile is required"),
  department: z.string().min(1, "Department is required"),
  company: z.string().min(1, "Company is required"),
  status: z.string().default("active"),
});
type EmployeeEditData = z.infer<typeof employeeEditSchema>;

export default function PortaCabinsPage() {
  const [showCabinForm, setShowCabinForm] = useState(false);
  const [editingCabin, setEditingCabin] = useState<PortaCabin | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportCabinId, setExportCabinId] = useState<string>("all");
  const [exportType, setExportType] = useState<string>("employees-excel");
  const [isExporting, setIsExporting] = useState(false);

  const [managingCabin, setManagingCabin] = useState<PortaCabin | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignRoomId, setAssignRoomId] = useState<number | null>(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState<string>("");

  const { toast } = useToast();

  const { data: cabins = [], isLoading } = useQuery<PortaCabin[]>({ queryKey: ["/api/porta-cabins"] });
  const { data: rooms = [] } = useQuery<Room[]>({ queryKey: ["/api/rooms"] });
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });

  // --- Export helper (fetch-based, sends session cookie) ---
  const handleExport = async (url: string, filename: string) => {
    setIsExporting(true);
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Export failed" }));
        throw new Error(err.message || "Export failed");
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({ title: "Export downloaded successfully" });
    } catch (error: any) {
      toast({ title: "Export failed", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const doExport = () => {
    const params = exportCabinId !== "all" ? `?cabinId=${exportCabinId}` : "";
    const cabinLabel = exportCabinId !== "all"
      ? (cabins.find(c => c.id.toString() === exportCabinId)?.name || "cabin")
      : "all";
    const ts = Date.now();
    switch (exportType) {
      case "employees-excel":
        handleExport(`/api/export/employees/excel${params}`, `employees_${cabinLabel}_${ts}.xlsx`);
        break;
      case "employees-pdf":
        handleExport(`/api/export/employees/pdf${params}`, `employees_${cabinLabel}_${ts}.pdf`);
        break;
      case "rooms-excel":
        handleExport(`/api/export/rooms/excel${params}`, `rooms_${cabinLabel}_${ts}.xlsx`);
        break;
      case "rooms-pdf":
        handleExport(`/api/export/rooms/pdf${params}`, `rooms_${cabinLabel}_${ts}.pdf`);
        break;
      case "qr-pdf":
        handleExport(`/api/export/rooms/qr-pdf${params}`, `qr_codes_${cabinLabel}_${ts}.pdf`);
        break;
    }
    setShowExportDialog(false);
  };

  // --- Cabin mutations ---
  const cabinForm = useForm<CabinFormData>({
    resolver: zodResolver(cabinFormSchema),
    defaultValues: { name: "", location: "", status: "active" },
  });

  const createCabinMutation = useMutation({
    mutationFn: async (data: CabinFormData) => (await apiRequest("POST", "/api/porta-cabins", data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/porta-cabins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowCabinForm(false);
      cabinForm.reset();
      toast({ title: "Porta Cabin created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCabinMutation = useMutation({
    mutationFn: async (data: CabinFormData & { id: number }) => {
      const { id, ...rest } = data;
      return (await apiRequest("PATCH", `/api/porta-cabins/${id}`, rest)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/porta-cabins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowCabinForm(false);
      setEditingCabin(null);
      cabinForm.reset();
      toast({ title: "Porta Cabin updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCabinMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/porta-cabins/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/porta-cabins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Porta Cabin deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // --- Room mutations ---
  const roomForm = useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: { roomNumber: "", portaCabinId: null, floor: "", capacity: 4, status: "available" },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: RoomFormData) => (await apiRequest("POST", "/api/rooms", data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowRoomForm(false);
      roomForm.reset();
      toast({ title: "Room created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateRoomMutation = useMutation({
    mutationFn: async (data: RoomFormData & { id: number }) => {
      const { id, ...rest } = data;
      return (await apiRequest("PATCH", `/api/rooms/${id}`, rest)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowRoomForm(false);
      setEditingRoom(null);
      roomForm.reset();
      // refresh selectedRoom
      if (editingRoom) setSelectedRoom(rooms.find(r => r.id === editingRoom.id) || null);
      toast({ title: "Room updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/rooms/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      if (selectedRoom?.id === deleteRoomMutation.variables) setSelectedRoom(null);
      toast({ title: "Room deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // --- Employee mutations ---
  const employeeForm = useForm<EmployeeEditData>({
    resolver: zodResolver(employeeEditSchema),
    defaultValues: { name: "", iqama: "", mobile: "", department: "", company: "", status: "active" },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeEditData & { id: number }) => {
      const { id, ...rest } = data;
      return (await apiRequest("PATCH", `/api/employees/${id}`, rest)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setShowEmployeeForm(false);
      setEditingEmployee(null);
      employeeForm.reset();
      toast({ title: "Employee updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const transferMutation = useMutation({
    mutationFn: async ({ employeeId, roomId }: { employeeId: number; roomId: number | null }) => {
      return (await apiRequest("POST", `/api/employees/${employeeId}/transfer`, { roomId })).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowAssignDialog(false);
      setAssignEmployeeId("");
      toast({ title: "Employee assigned to room" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeFromRoomMutation = useMutation({
    mutationFn: async ({ employeeId }: { employeeId: number }) => {
      return (await apiRequest("POST", `/api/employees/${employeeId}/transfer`, { roomId: null })).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Employee removed from room" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // --- Helpers ---
  const openManage = (cabin: PortaCabin) => {
    setManagingCabin(cabin);
    setSelectedRoom(null);
  };

  const openRoomEdit = (room: Room) => {
    setEditingRoom(room);
    roomForm.reset({
      roomNumber: room.roomNumber,
      portaCabinId: room.portaCabinId ?? managingCabin?.id ?? null,
      floor: room.floor || "",
      capacity: room.capacity,
      status: room.status,
    });
    setShowRoomForm(true);
  };

  const openRoomCreate = () => {
    setEditingRoom(null);
    roomForm.reset({ roomNumber: "", portaCabinId: managingCabin?.id ?? null, floor: "", capacity: 4, status: "available" });
    setShowRoomForm(true);
  };

  const openEmployeeEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    employeeForm.reset({
      name: emp.name, iqama: emp.iqama, mobile: emp.mobile,
      department: emp.department, company: emp.company, status: emp.status,
    });
    setShowEmployeeForm(true);
  };

  const openAssignEmployee = (roomId: number) => {
    setAssignRoomId(roomId);
    setAssignEmployeeId("");
    setShowAssignDialog(true);
  };

  const getCabinRooms = (cabinId: number) => rooms.filter(r => r.portaCabinId === cabinId);
  const getRoomEmployees = (roomId: number) => employees.filter(e => e.roomId === roomId);
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  // Unassigned employees or those in this cabin who can be assigned
  const unassignedEmployees = employees.filter(e => e.roomId === null && e.status === "active");

  const managingCabinRooms = managingCabin ? getCabinRooms(managingCabin.id) : [];
  const selectedRoomEmployees = selectedRoom ? getRoomEmployees(selectedRoom.id) : [];

  const filteredCabins = cabins.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.location || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Porta Cabins</h1>
          <p className="text-muted-foreground">Manage accommodation porta cabins</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExportDialog(true)} data-testid="button-export-cabins">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => { setEditingCabin(null); cabinForm.reset({ name: "", location: "", status: "active" }); setShowCabinForm(true); }} data-testid="button-add-cabin">
            <Plus className="h-4 w-4 mr-2" />
            Add Cabin
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cabins..."
          className="pl-9"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          data-testid="input-search-cabins"
        />
      </div>

      {/* Cabin list */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-6"><div className="animate-pulse space-y-3"><div className="h-5 bg-muted rounded w-1/2" /><div className="h-4 bg-muted rounded w-3/4" /></div></CardContent></Card>
          ))}
        </div>
      ) : filteredCabins.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Home className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">No porta cabins found</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm ? "Try adjusting your search" : "Add your first porta cabin to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCabins.map(cabin => {
            const cabinRooms = getCabinRooms(cabin.id);
            const occupiedCount = cabinRooms.filter(r => r.status === "occupied").length;
            const availableCount = cabinRooms.filter(r => r.status === "available").length;
            const totalEmployees = cabinRooms.reduce((acc, r) => acc + getRoomEmployees(r.id).length, 0);
            return (
              <Card key={cabin.id} className="hover-elevate" data-testid={`card-cabin-${cabin.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{cabin.name}</h3>
                      {cabin.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />{cabin.location}
                        </p>
                      )}
                    </div>
                    <Badge variant={cabin.status === "active" ? "default" : "secondary"}>{cabin.status}</Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-xs text-center mb-4">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="font-bold text-sm">{cabinRooms.length}</p>
                      <p className="text-muted-foreground">Rooms</p>
                    </div>
                    <div className="p-2 rounded bg-orange-50 dark:bg-orange-950/20">
                      <p className="font-bold text-sm text-orange-600">{occupiedCount}</p>
                      <p className="text-muted-foreground">Occup.</p>
                    </div>
                    <div className="p-2 rounded bg-green-50 dark:bg-green-950/20">
                      <p className="font-bold text-sm text-green-600">{availableCount}</p>
                      <p className="text-muted-foreground">Avail.</p>
                    </div>
                    <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/20">
                      <p className="font-bold text-sm text-blue-600">{totalEmployees}</p>
                      <p className="text-muted-foreground">Empl.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    <Button size="sm" onClick={() => openManage(cabin)} data-testid={`button-manage-cabin-${cabin.id}`}>
                      <Settings className="h-3.5 w-3.5 mr-1" />
                      Manage
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditingCabin(cabin); cabinForm.reset({ name: cabin.name, location: cabin.location || "", status: cabin.status }); setShowCabinForm(true); }} data-testid={`button-edit-cabin-${cabin.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Delete "${cabin.name}"?`)) deleteCabinMutation.mutate(cabin.id); }} data-testid={`button-delete-cabin-${cabin.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ===== Export Dialog ===== */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium block mb-1.5">Filter by Cabin</label>
              <Select value={exportCabinId} onValueChange={setExportCabinId}>
                <SelectTrigger data-testid="select-export-cabin">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cabins</SelectItem>
                  {cabins.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Report Type</label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger data-testid="select-export-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employees-excel">
                    <div className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-green-600" />Employees — Excel</div>
                  </SelectItem>
                  <SelectItem value="employees-pdf">
                    <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-red-600" />Employees — PDF</div>
                  </SelectItem>
                  <SelectItem value="rooms-excel">
                    <div className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-green-600" />Rooms — Excel</div>
                  </SelectItem>
                  <SelectItem value="rooms-pdf">
                    <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-red-600" />Rooms — PDF</div>
                  </SelectItem>
                  <SelectItem value="qr-pdf">
                    <div className="flex items-center gap-2"><Printer className="h-4 w-4 text-primary" />QR Codes — PDF</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
              <Button onClick={doExport} disabled={isExporting} data-testid="button-confirm-export">
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Cabin Add/Edit Dialog ===== */}
      <Dialog open={showCabinForm} onOpenChange={setShowCabinForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCabin ? "Edit Porta Cabin" : "Add New Porta Cabin"}</DialogTitle>
          </DialogHeader>
          <Form {...cabinForm}>
            <form onSubmit={cabinForm.handleSubmit(d => editingCabin ? updateCabinMutation.mutate({ ...d, id: editingCabin.id }) : createCabinMutation.mutate(d))} className="space-y-4">
              <FormField control={cabinForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Cabin Name</FormLabel><FormControl><Input placeholder="e.g. Cabin A" {...field} data-testid="input-cabin-name" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={cabinForm.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Location (Optional)</FormLabel><FormControl><Input placeholder="e.g. North Zone" {...field} data-testid="input-cabin-location" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={cabinForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCabinForm(false)}>Cancel</Button>
                <Button type="submit" disabled={createCabinMutation.isPending || updateCabinMutation.isPending} data-testid="button-save-cabin">
                  {createCabinMutation.isPending || updateCabinMutation.isPending ? "Saving..." : editingCabin ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== Cabin Manage Dialog (Rooms → Employees drill-down) ===== */}
      <Dialog open={!!managingCabin} onOpenChange={open => { if (!open) { setManagingCabin(null); setSelectedRoom(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedRoom && (
                <Button size="icon" variant="ghost" onClick={() => setSelectedRoom(null)} className="h-8 w-8" data-testid="button-back-to-rooms">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <DialogTitle>
                  {selectedRoom ? `${managingCabin?.name} — Room ${selectedRoom.roomNumber}` : `Manage — ${managingCabin?.name}`}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedRoom
                    ? `Employees assigned to Room ${selectedRoom.roomNumber}`
                    : `${managingCabinRooms.length} rooms${managingCabin?.location ? ` · ${managingCabin.location}` : ""}`}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* ---- ROOMS VIEW ---- */}
          {!selectedRoom && (
            <div className="flex-1 overflow-y-auto space-y-3">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { label: "Total", value: managingCabinRooms.length, color: "" },
                  { label: "Occupied", value: managingCabinRooms.filter(r => r.status === "occupied").length, color: "text-orange-600" },
                  { label: "Available", value: managingCabinRooms.filter(r => r.status === "available").length, color: "text-green-600" },
                  { label: "Maintenance", value: managingCabinRooms.filter(r => r.status === "maintenance").length, color: "text-yellow-600" },
                ].map(s => (
                  <div key={s.label} className="p-2.5 rounded-md bg-muted/50">
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Click a room to view & manage its employees</p>
                <Button size="sm" onClick={openRoomCreate} data-testid="button-add-room-manage">
                  <Plus className="h-3.5 w-3.5 mr-1" />Add Room
                </Button>
              </div>

              {managingCabinRooms.length === 0 ? (
                <div className="text-center py-10">
                  <DoorOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No rooms in this cabin yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {managingCabinRooms.map(room => {
                    const roomEmps = getRoomEmployees(room.id);
                    const isFull = roomEmps.length >= room.capacity;
                    return (
                      <div
                        key={room.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => setSelectedRoom(room)}
                        data-testid={`row-room-${room.id}`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
                          <DoorOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{room.roomNumber}</span>
                            {room.floor && <span className="text-xs text-muted-foreground">Floor {room.floor}</span>}
                            <Badge variant={room.status === "available" ? "default" : room.status === "occupied" ? "secondary" : "outline"} className="text-xs">
                              {room.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span className={isFull ? "text-orange-600 font-medium" : ""}>{roomEmps.length}/{room.capacity}</span>
                            </span>
                            <span>Click to view employees →</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openRoomEdit(room)} data-testid={`button-edit-room-${room.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm(`Delete room ${room.roomNumber}?`)) deleteRoomMutation.mutate(room.id); }} data-testid={`button-delete-room-${room.id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ---- ROOM EMPLOYEES VIEW ---- */}
          {selectedRoom && (
            <div className="flex-1 overflow-y-auto space-y-3">
              {/* Room info */}
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                {[
                  { label: "Floor", value: selectedRoom.floor || "—" },
                  { label: "Capacity", value: selectedRoom.capacity },
                  { label: "Occupants", value: selectedRoomEmployees.length },
                ].map(s => (
                  <div key={s.label} className="p-2.5 rounded-md bg-muted/50">
                    <p className="text-base font-bold">{s.value}</p>
                    <p className="text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Assigned Employees ({selectedRoomEmployees.length})
                </p>
                <Button
                  size="sm"
                  onClick={() => openAssignEmployee(selectedRoom.id)}
                  disabled={selectedRoomEmployees.length >= selectedRoom.capacity}
                  data-testid="button-assign-employee"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Assign Employee
                </Button>
              </div>

              {selectedRoomEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No employees assigned to this room</p>
                  <Button size="sm" className="mt-3" onClick={() => openAssignEmployee(selectedRoom.id)} data-testid="button-assign-first-employee">
                    <UserPlus className="h-3.5 w-3.5 mr-1" />Assign Employee
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="hidden sm:table-cell">Department</TableHead>
                      <TableHead className="hidden sm:table-cell">Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRoomEmployees.map(emp => (
                      <TableRow key={emp.id} data-testid={`row-emp-room-${emp.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={emp.profileImage || undefined} />
                              <AvatarFallback className="text-xs">{getInitials(emp.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{emp.name}</p>
                              <p className="text-xs text-muted-foreground">{emp.employeeIdNo}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{emp.department}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{emp.company}</TableCell>
                        <TableCell><Badge variant={emp.status === "active" ? "default" : "secondary"}>{emp.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEmployeeEdit(emp)} data-testid={`button-edit-emp-${emp.id}`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm(`Remove ${emp.name} from this room?`)) removeFromRoomMutation.mutate({ employeeId: emp.id }); }} data-testid={`button-remove-emp-${emp.id}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Room Add/Edit Dialog ===== */}
      <Dialog open={showRoomForm} onOpenChange={setShowRoomForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit Room" : `Add Room to ${managingCabin?.name}`}</DialogTitle>
          </DialogHeader>
          <Form {...roomForm}>
            <form onSubmit={roomForm.handleSubmit(d => editingRoom ? updateRoomMutation.mutate({ ...d, id: editingRoom.id }) : createRoomMutation.mutate(d))} className="space-y-4">
              <FormField control={roomForm.control} name="roomNumber" render={({ field }) => (
                <FormItem><FormLabel>Room Number</FormLabel><FormControl><Input {...field} data-testid="input-room-number" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={roomForm.control} name="floor" render={({ field }) => (
                  <FormItem><FormLabel>Floor (Optional)</FormLabel><FormControl><Input {...field} data-testid="input-floor" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={roomForm.control} name="capacity" render={({ field }) => (
                  <FormItem><FormLabel>Capacity</FormLabel><FormControl><Input type="number" min={1} {...field} data-testid="input-capacity" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={roomForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowRoomForm(false)}>Cancel</Button>
                <Button type="submit" disabled={createRoomMutation.isPending || updateRoomMutation.isPending} data-testid="button-save-room">
                  {createRoomMutation.isPending || updateRoomMutation.isPending ? "Saving..." : editingRoom ? "Update Room" : "Create Room"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== Employee Edit Dialog ===== */}
      <Dialog open={showEmployeeForm} onOpenChange={setShowEmployeeForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee — {editingEmployee?.name}</DialogTitle>
          </DialogHeader>
          <Form {...employeeForm}>
            <form onSubmit={employeeForm.handleSubmit(d => updateEmployeeMutation.mutate({ ...d, id: editingEmployee!.id }))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={employeeForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={employeeForm.control} name="mobile" render={({ field }) => (
                  <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={employeeForm.control} name="iqama" render={({ field }) => (
                  <FormItem><FormLabel>Iqama</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={employeeForm.control} name="department" render={({ field }) => (
                  <FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={employeeForm.control} name="company" render={({ field }) => (
                  <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={employeeForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowEmployeeForm(false)}>Cancel</Button>
                <Button type="submit" disabled={updateEmployeeMutation.isPending} data-testid="button-save-employee-edit">
                  {updateEmployeeMutation.isPending ? "Saving..." : "Update Employee"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== Assign Employee to Room Dialog ===== */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Employee to Room {selectedRoom?.roomNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Select an unassigned employee to add to this room.
              {selectedRoom && (
                <span> Available spots: {selectedRoom.capacity - selectedRoomEmployees.length}</span>
              )}
            </p>
            <div>
              <label className="text-sm font-medium block mb-1.5">Select Employee</label>
              <Select value={assignEmployeeId} onValueChange={setAssignEmployeeId}>
                <SelectTrigger data-testid="select-assign-employee">
                  <SelectValue placeholder="Choose an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {unassignedEmployees.length === 0 ? (
                    <SelectItem value="none" disabled>No unassigned employees available</SelectItem>
                  ) : (
                    unassignedEmployees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name} — {emp.employeeIdNo} ({emp.department})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
              <Button
                disabled={!assignEmployeeId || assignEmployeeId === "none" || transferMutation.isPending}
                onClick={() => {
                  if (assignEmployeeId && assignRoomId) {
                    transferMutation.mutate({ employeeId: parseInt(assignEmployeeId), roomId: assignRoomId });
                  }
                }}
                data-testid="button-confirm-assign"
              >
                {transferMutation.isPending ? "Assigning..." : "Assign Employee"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
