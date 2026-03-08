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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ChevronDown,
  ChevronUp,
  Settings,
  Download,
  FileSpreadsheet,
  FileText,
  X,
} from "lucide-react";
import type { PortaCabin, Room, Employee } from "@shared/schema";

// --- Cabin form ---
const cabinFormSchema = z.object({
  name: z.string().min(1, "Cabin name is required"),
  location: z.string().optional(),
  status: z.string().default("active"),
});
type CabinFormData = z.infer<typeof cabinFormSchema>;

// --- Room form ---
const roomFormSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  portaCabinId: z.number().nullable().optional(),
  floor: z.string().optional(),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  status: z.string().default("available"),
});
type RoomFormData = z.infer<typeof roomFormSchema>;

// --- Employee edit form ---
const employeeEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  iqama: z.string().min(1, "Iqama is required"),
  mobile: z.string().min(1, "Mobile is required"),
  department: z.string().min(1, "Department is required"),
  company: z.string().min(1, "Company is required"),
  status: z.string().default("active"),
});
type EmployeeEditData = z.infer<typeof employeeEditSchema>;

// --- Cabin Map Card (expandable) ---
function CabinMapCard({ cabin, rooms, employees }: {
  cabin: PortaCabin;
  rooms: Room[];
  employees: Employee[];
}) {
  const [expanded, setExpanded] = useState(false);
  const cabinRooms = rooms.filter((r) => r.portaCabinId === cabin.id);

  return (
    <Card className="border-l-4 border-l-primary" data-testid={`card-cabin-map-${cabin.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            <span className="font-semibold">{cabin.name}</span>
            {cabin.location && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {cabin.location}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={cabin.status === "active" ? "default" : "secondary"}>
              {cabin.status}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
              data-testid={`button-expand-cabin-${cabin.id}`}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
          <div className="p-2 rounded bg-muted/50">
            <p className="font-bold text-base">{cabinRooms.length}</p>
            <p className="text-muted-foreground">Total Rooms</p>
          </div>
          <div className="p-2 rounded bg-orange-50 dark:bg-orange-950/20">
            <p className="font-bold text-base text-orange-600">{cabinRooms.filter((r) => r.status === "occupied").length}</p>
            <p className="text-muted-foreground">Occupied</p>
          </div>
          <div className="p-2 rounded bg-green-50 dark:bg-green-950/20">
            <p className="font-bold text-base text-green-600">{cabinRooms.filter((r) => r.status === "available").length}</p>
            <p className="text-muted-foreground">Available</p>
          </div>
        </div>

        {expanded && cabinRooms.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 border-t pt-3">
            {cabinRooms.map((room) => {
              const occupants = employees.filter((e) => e.roomId === room.id).length;
              const occupancyPercent = room.capacity > 0 ? Math.round((occupants / room.capacity) * 100) : 0;
              const isFull = occupants >= room.capacity;
              return (
                <div
                  key={room.id}
                  className={`p-2 rounded border text-xs ${isFull ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20" : "border-border bg-muted/30"}`}
                  data-testid={`room-map-cell-${room.id}`}
                >
                  <p className="font-semibold">{room.roomNumber}</p>
                  <p className="text-muted-foreground">
                    {occupants}/{room.capacity}
                  </p>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${isFull ? "bg-orange-500" : "bg-primary"}`}
                      style={{ width: `${occupancyPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {expanded && cabinRooms.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2 border-t mt-2">
            No rooms assigned to this cabin
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function PortaCabinsPage() {
  const [showCabinForm, setShowCabinForm] = useState(false);
  const [editingCabin, setEditingCabin] = useState<PortaCabin | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMap, setShowMap] = useState(false);

  // Manage cabin dialog
  const [managingCabin, setManagingCabin] = useState<PortaCabin | null>(null);
  const [activeTab, setActiveTab] = useState<"rooms" | "employees">("rooms");

  // Room form inside manage dialog
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Employee edit form inside manage dialog
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const { toast } = useToast();

  const { data: cabins = [], isLoading } = useQuery<PortaCabin[]>({
    queryKey: ["/api/porta-cabins"],
  });
  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // --- Cabin Form ---
  const cabinForm = useForm<CabinFormData>({
    resolver: zodResolver(cabinFormSchema),
    defaultValues: { name: "", location: "", status: "active" },
  });

  const createCabinMutation = useMutation({
    mutationFn: async (data: CabinFormData) => {
      const res = await apiRequest("POST", "/api/porta-cabins", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/porta-cabins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowCabinForm(false);
      cabinForm.reset();
      toast({ title: "Porta Cabin created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateCabinMutation = useMutation({
    mutationFn: async (data: CabinFormData & { id: number }) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PATCH", `/api/porta-cabins/${id}`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/porta-cabins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowCabinForm(false);
      setEditingCabin(null);
      cabinForm.reset();
      toast({ title: "Porta Cabin updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteCabinMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/porta-cabins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/porta-cabins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Porta Cabin deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // --- Room Form (within manage dialog) ---
  const roomForm = useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: { roomNumber: "", portaCabinId: null, floor: "", capacity: 4, status: "available" },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: RoomFormData) => {
      const res = await apiRequest("POST", "/api/rooms", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowRoomForm(false);
      roomForm.reset();
      toast({ title: "Room created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async (data: RoomFormData & { id: number }) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PATCH", `/api/rooms/${id}`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowRoomForm(false);
      setEditingRoom(null);
      roomForm.reset();
      toast({ title: "Room updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Room deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // --- Employee edit form (within manage dialog) ---
  const employeeForm = useForm<EmployeeEditData>({
    resolver: zodResolver(employeeEditSchema),
    defaultValues: { name: "", iqama: "", mobile: "", department: "", company: "", status: "active" },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeEditData & { id: number }) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PATCH", `/api/employees/${id}`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setShowEmployeeForm(false);
      setEditingEmployee(null);
      employeeForm.reset();
      toast({ title: "Employee updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // --- Helpers ---
  const openCabinEdit = (cabin: PortaCabin) => {
    setEditingCabin(cabin);
    cabinForm.reset({ name: cabin.name, location: cabin.location || "", status: cabin.status });
    setShowCabinForm(true);
  };

  const openCabinCreate = () => {
    setEditingCabin(null);
    cabinForm.reset({ name: "", location: "", status: "active" });
    setShowCabinForm(true);
  };

  const openManage = (cabin: PortaCabin) => {
    setManagingCabin(cabin);
    setActiveTab("rooms");
  };

  const openRoomEdit = (room: Room, cabinId: number) => {
    setEditingRoom(room);
    roomForm.reset({
      roomNumber: room.roomNumber,
      portaCabinId: room.portaCabinId ?? cabinId,
      floor: room.floor || "",
      capacity: room.capacity,
      status: room.status,
    });
    setShowRoomForm(true);
  };

  const openRoomCreate = (cabinId: number) => {
    setEditingRoom(null);
    roomForm.reset({ roomNumber: "", portaCabinId: cabinId, floor: "", capacity: 4, status: "available" });
    setShowRoomForm(true);
  };

  const openEmployeeEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    employeeForm.reset({
      name: emp.name,
      iqama: emp.iqama,
      mobile: emp.mobile,
      department: emp.department,
      company: emp.company,
      status: emp.status,
    });
    setShowEmployeeForm(true);
  };

  const onCabinSubmit = (data: CabinFormData) => {
    if (editingCabin) updateCabinMutation.mutate({ ...data, id: editingCabin.id });
    else createCabinMutation.mutate(data);
  };

  const onRoomSubmit = (data: RoomFormData) => {
    if (editingRoom) updateRoomMutation.mutate({ ...data, id: editingRoom.id });
    else createRoomMutation.mutate(data);
  };

  const onEmployeeSubmit = (data: EmployeeEditData) => {
    if (editingEmployee) updateEmployeeMutation.mutate({ ...data, id: editingEmployee.id });
  };

  const getCabinRooms = (cabinId: number) => rooms.filter((r) => r.portaCabinId === cabinId);
  const getCabinEmployees = (cabinId: number) => {
    const cabinRoomIds = new Set(rooms.filter((r) => r.portaCabinId === cabinId).map((r) => r.id));
    return employees.filter((e) => e.roomId !== null && cabinRoomIds.has(e.roomId!));
  };
  const getRoomLabel = (roomId: number | null) => {
    if (!roomId) return "Unassigned";
    return rooms.find((r) => r.id === roomId)?.roomNumber || "Unknown";
  };
  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const filteredCabins = cabins.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.location || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Rooms + employees for the currently managed cabin
  const managingCabinRooms = managingCabin ? getCabinRooms(managingCabin.id) : [];
  const managingCabinEmployees = managingCabin ? getCabinEmployees(managingCabin.id) : [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Porta Cabins
          </h1>
          <p className="text-muted-foreground">Manage accommodation porta cabins</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMap(!showMap)} data-testid="button-toggle-map">
            {showMap ? "List View" : "Cabin Map"}
          </Button>
          <Button onClick={openCabinCreate} data-testid="button-add-cabin">
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
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-cabins"
        />
      </div>

      {/* Map View */}
      {showMap ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Cabin Map View</h2>
          {filteredCabins.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Home className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No cabins found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCabins.map((cabin) => (
                <CabinMapCard key={cabin.id} cabin={cabin} rooms={rooms} employees={employees} />
              ))}
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-5 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
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
        /* List view cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCabins.map((cabin) => {
            const cabinRooms = getCabinRooms(cabin.id);
            return (
              <Card key={cabin.id} className="hover-elevate" data-testid={`card-cabin-${cabin.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{cabin.name}</h3>
                      {cabin.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {cabin.location}
                        </p>
                      )}
                    </div>
                    <Badge variant={cabin.status === "active" ? "default" : "secondary"}>
                      {cabin.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-center mb-4">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="font-bold">{cabinRooms.length}</p>
                      <p className="text-muted-foreground">Rooms</p>
                    </div>
                    <div className="p-2 rounded bg-orange-50 dark:bg-orange-950/20">
                      <p className="font-bold text-orange-600">{cabinRooms.filter((r) => r.status === "occupied").length}</p>
                      <p className="text-muted-foreground">Occupied</p>
                    </div>
                    <div className="p-2 rounded bg-green-50 dark:bg-green-950/20">
                      <p className="font-bold text-green-600">{cabinRooms.filter((r) => r.status === "available").length}</p>
                      <p className="text-muted-foreground">Available</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => openManage(cabin)}
                      data-testid={`button-manage-cabin-${cabin.id}`}
                    >
                      <Settings className="h-3.5 w-3.5 mr-1" />
                      Manage
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" data-testid={`button-export-cabin-${cabin.id}`}>
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => window.open(`/api/export/employees/excel?cabinId=${cabin.id}`, "_blank")}
                          data-testid={`button-export-cabin-employees-excel-${cabin.id}`}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Employees Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`/api/export/employees/pdf?cabinId=${cabin.id}`, "_blank")}
                          data-testid={`button-export-cabin-employees-pdf-${cabin.id}`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Employees PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`/api/export/rooms/excel?cabinId=${cabin.id}`, "_blank")}
                          data-testid={`button-export-cabin-rooms-excel-${cabin.id}`}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Rooms Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`/api/export/rooms/pdf?cabinId=${cabin.id}`, "_blank")}
                          data-testid={`button-export-cabin-rooms-pdf-${cabin.id}`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Rooms PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openCabinEdit(cabin)}
                      data-testid={`button-edit-cabin-${cabin.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete "${cabin.name}"? This will unassign its rooms.`)) {
                          deleteCabinMutation.mutate(cabin.id);
                        }
                      }}
                      data-testid={`button-delete-cabin-${cabin.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ===== Cabin Add/Edit Dialog ===== */}
      <Dialog open={showCabinForm} onOpenChange={setShowCabinForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCabin ? "Edit Porta Cabin" : "Add New Porta Cabin"}</DialogTitle>
          </DialogHeader>
          <Form {...cabinForm}>
            <form onSubmit={cabinForm.handleSubmit(onCabinSubmit)} className="space-y-4">
              <FormField
                control={cabinForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cabin Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Cabin A" {...field} data-testid="input-cabin-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={cabinForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. North Zone" {...field} data-testid="input-cabin-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={cabinForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-cabin-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCabinForm(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCabinMutation.isPending || updateCabinMutation.isPending}
                  data-testid="button-save-cabin"
                >
                  {createCabinMutation.isPending || updateCabinMutation.isPending
                    ? "Saving..."
                    : editingCabin
                    ? "Update Cabin"
                    : "Create Cabin"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== Cabin Management Dialog ===== */}
      <Dialog open={!!managingCabin} onOpenChange={(open) => { if (!open) setManagingCabin(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">
                  Manage — {managingCabin?.name}
                </DialogTitle>
                {managingCabin?.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />{managingCabin.location}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 mr-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" data-testid="button-manage-export">
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => window.open(`/api/export/employees/excel?cabinId=${managingCabin?.id}`, "_blank")}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Employees Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => window.open(`/api/export/employees/pdf?cabinId=${managingCabin?.id}`, "_blank")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Employees PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => window.open(`/api/export/rooms/excel?cabinId=${managingCabin?.id}`, "_blank")}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Rooms Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => window.open(`/api/export/rooms/pdf?cabinId=${managingCabin?.id}`, "_blank")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Rooms PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DialogHeader>

          {/* Summary mini-stats */}
          <div className="grid grid-cols-3 gap-3 px-1 py-2">
            <div className="p-3 rounded-md bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Rooms</p>
              <p className="text-xl font-bold">{managingCabinRooms.length}</p>
            </div>
            <div className="p-3 rounded-md bg-orange-50 dark:bg-orange-950/20 text-center">
              <p className="text-xs text-muted-foreground">Occupied</p>
              <p className="text-xl font-bold text-orange-600">
                {managingCabinRooms.filter((r) => r.status === "occupied").length}
              </p>
            </div>
            <div className="p-3 rounded-md bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Employees</p>
              <p className="text-xl font-bold">{managingCabinEmployees.length}</p>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "rooms" | "employees")}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="w-full">
              <TabsTrigger value="rooms" className="flex-1" data-testid="tab-rooms">
                <DoorOpen className="h-4 w-4 mr-1.5" />
                Rooms ({managingCabinRooms.length})
              </TabsTrigger>
              <TabsTrigger value="employees" className="flex-1" data-testid="tab-employees">
                <Users className="h-4 w-4 mr-1.5" />
                Employees ({managingCabinEmployees.length})
              </TabsTrigger>
            </TabsList>

            {/* Rooms tab */}
            <TabsContent value="rooms" className="flex-1 overflow-y-auto mt-3">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-muted-foreground">
                  Rooms assigned to {managingCabin?.name}
                </p>
                <Button
                  size="sm"
                  onClick={() => openRoomCreate(managingCabin!.id)}
                  data-testid="button-add-room-in-cabin"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Room
                </Button>
              </div>
              {managingCabinRooms.length === 0 ? (
                <div className="text-center py-8">
                  <DoorOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No rooms assigned to this cabin</p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => openRoomCreate(managingCabin!.id)}
                    data-testid="button-add-first-room"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add First Room
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room No</TableHead>
                      <TableHead>Floor</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Occupants</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {managingCabinRooms.map((room) => {
                      const occupants = employees.filter((e) => e.roomId === room.id).length;
                      return (
                        <TableRow key={room.id} data-testid={`row-manage-room-${room.id}`}>
                          <TableCell className="font-medium">{room.roomNumber}</TableCell>
                          <TableCell>{room.floor || "—"}</TableCell>
                          <TableCell>{room.capacity}</TableCell>
                          <TableCell>
                            <span className={occupants >= room.capacity ? "text-orange-600 font-medium" : ""}>
                              {occupants}/{room.capacity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                room.status === "available"
                                  ? "default"
                                  : room.status === "occupied"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {room.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openRoomEdit(room, managingCabin!.id)}
                                data-testid={`button-edit-room-manage-${room.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm(`Delete room ${room.roomNumber}?`)) {
                                    deleteRoomMutation.mutate(room.id);
                                  }
                                }}
                                data-testid={`button-delete-room-manage-${room.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Employees tab */}
            <TabsContent value="employees" className="flex-1 overflow-y-auto mt-3">
              <p className="text-sm text-muted-foreground mb-3">
                Employees in rooms of {managingCabin?.name}
              </p>
              {managingCabinEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No employees in this cabin's rooms</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead className="hidden sm:table-cell">Department</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {managingCabinEmployees.map((emp) => (
                      <TableRow key={emp.id} data-testid={`row-manage-emp-${emp.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={emp.profileImage || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(emp.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{emp.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {emp.employeeIdNo}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {emp.department}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getRoomLabel(emp.roomId)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={emp.status === "active" ? "default" : "secondary"}>
                            {emp.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEmployeeEdit(emp)}
                            data-testid={`button-edit-emp-manage-${emp.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ===== Room Add/Edit Dialog (nested) ===== */}
      <Dialog open={showRoomForm} onOpenChange={setShowRoomForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
          </DialogHeader>
          <Form {...roomForm}>
            <form onSubmit={roomForm.handleSubmit(onRoomSubmit)} className="space-y-4">
              <FormField
                control={roomForm.control}
                name="roomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Number</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-room-number-manage" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={roomForm.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-floor-manage" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={roomForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} data-testid="input-capacity-manage" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={roomForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-room-status-manage">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowRoomForm(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRoomMutation.isPending || updateRoomMutation.isPending}
                  data-testid="button-save-room-manage"
                >
                  {createRoomMutation.isPending || updateRoomMutation.isPending
                    ? "Saving..."
                    : editingRoom
                    ? "Update Room"
                    : "Create Room"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== Employee Edit Dialog (nested) ===== */}
      <Dialog open={showEmployeeForm} onOpenChange={setShowEmployeeForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee — {editingEmployee?.name}</DialogTitle>
          </DialogHeader>
          <Form {...employeeForm}>
            <form onSubmit={employeeForm.handleSubmit(onEmployeeSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={employeeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-emp-name-manage" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={employeeForm.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-emp-mobile-manage" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={employeeForm.control}
                  name="iqama"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Iqama Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-emp-iqama-manage" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={employeeForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-emp-dept-manage" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={employeeForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-emp-company-manage" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={employeeForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-emp-status-manage">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowEmployeeForm(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateEmployeeMutation.isPending}
                  data-testid="button-save-emp-manage"
                >
                  {updateEmployeeMutation.isPending ? "Saving..." : "Update Employee"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
