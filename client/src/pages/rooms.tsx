import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  DoorOpen,
  QrCode,
  Users,
  ExternalLink,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  LayoutGrid,
} from "lucide-react";
import type { Room, Employee } from "@shared/schema";

const roomFormSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  building: z.string().min(1, "Building is required"),
  floor: z.string().min(1, "Floor is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  status: z.string().default("available"),
});

type RoomFormData = z.infer<typeof roomFormSchema>;

export default function RoomsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrRoom, setQrRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const statusFilter = searchParams.get("status");

  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const { data: roomEmployees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/rooms", selectedRoom?.id, "employees"],
    enabled: !!selectedRoom,
  });

  const { data: qrDataUrl } = useQuery<{ qrDataUrl: string }>({
    queryKey: ["/api/rooms", qrRoom?.id, "qr"],
    enabled: !!qrRoom,
  });

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      roomNumber: "",
      building: "",
      floor: "",
      capacity: 4,
      status: "available",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RoomFormData) => {
      const res = await apiRequest("POST", "/api/rooms", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowForm(false);
      form.reset();
      toast({ title: "Room created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: RoomFormData & { id: number }) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PATCH", `/api/rooms/${id}`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowForm(false);
      setEditingRoom(null);
      form.reset();
      toast({ title: "Room updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
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

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    form.reset({
      roomNumber: room.roomNumber,
      building: room.building,
      floor: room.floor,
      capacity: room.capacity,
      status: room.status,
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingRoom(null);
    form.reset({
      roomNumber: "",
      building: "",
      floor: "",
      capacity: 4,
      status: "available",
    });
    setShowForm(true);
  };

  const onSubmit = (data: RoomFormData) => {
    if (editingRoom) {
      updateMutation.mutate({ ...data, id: editingRoom.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const copyQRLink = (room: Room) => {
    const url = `${window.location.origin}/room/${room.qrHash}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  };

  let filteredRooms = rooms.filter(
    (r) =>
      r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.building.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (statusFilter) {
    filteredRooms = filteredRooms.filter((r) => r.status === statusFilter);
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Rooms</h1>
          <p className="text-muted-foreground">
            Manage accommodation rooms and QR codes
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-export-rooms">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                data-testid="button-export-rooms-excel"
                onClick={() => window.open("/api/export/rooms/excel", "_blank")}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                data-testid="button-export-rooms-pdf"
                onClick={() => window.open("/api/export/rooms/pdf", "_blank")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export to PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="button-export-qr-single"
                onClick={() => window.open("/api/export/rooms/qr-pdf?layout=single", "_blank")}
              >
                <Printer className="h-4 w-4 mr-2" />
                QR Codes (1 per page)
              </DropdownMenuItem>
              <DropdownMenuItem
                data-testid="button-export-qr-grid"
                onClick={() => window.open("/api/export/rooms/qr-pdf?layout=grid", "_blank")}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                QR Codes (4 per page)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={openCreate} data-testid="button-add-room">
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search rooms..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-rooms"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-5 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <DoorOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">No rooms found</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm ? "Try adjusting your search" : "Add your first room to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => (
            <Card key={room.id} className="hover-elevate" data-testid={`card-room-${room.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{room.roomNumber}</h3>
                    <p className="text-sm text-muted-foreground">
                      {room.building} - Floor {room.floor}
                    </p>
                  </div>
                  <Badge
                    variant={room.status === "available" ? "default" : room.status === "occupied" ? "secondary" : "outline"}
                  >
                    {room.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {room.capacity}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRoom(room)}
                    data-testid={`button-view-room-${room.id}`}
                  >
                    <Users className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setQrRoom(room); setShowQR(true); }}
                    data-testid={`button-qr-room-${room.id}`}
                  >
                    <QrCode className="h-3.5 w-3.5 mr-1" />
                    QR
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(room)}
                    data-testid={`button-edit-room-${room.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this room?")) {
                        deleteMutation.mutate(room.id);
                      }
                    }}
                    data-testid={`button-delete-room-${room.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? "Edit Room" : "Add New Room"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Number</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-room-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="building"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-building" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-floor" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} data-testid="input-capacity" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-room-status">
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
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-room"
                >
                  {createMutation.isPending || updateMutation.isPending
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

      <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Room {selectedRoom?.roomNumber} - {selectedRoom?.building}
            </DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground">Floor</p>
                  <p className="font-semibold">{selectedRoom.floor}</p>
                </div>
                <div className="text-center p-3 rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-semibold">{selectedRoom.capacity}</p>
                </div>
                <div className="text-center p-3 rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedRoom.status === "available" ? "default" : "secondary"}>
                    {selectedRoom.status}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Assigned Employees ({roomEmployees.length})</h4>
                {roomEmployees.length > 0 ? (
                  <div className="space-y-2">
                    {roomEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center gap-3 p-3 rounded-md bg-muted/50"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={emp.profileImage || undefined} />
                          <AvatarFallback className="text-xs">
                            {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {emp.employeeIdNo} - {emp.department}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No employees assigned to this room
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              QR Code - Room {qrRoom?.roomNumber}
            </DialogTitle>
          </DialogHeader>
          {qrRoom && (
            <div className="text-center space-y-4">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl.qrDataUrl}
                  alt={`QR Code for Room ${qrRoom.roomNumber}`}
                  className="mx-auto w-48 h-48"
                  data-testid="img-qr-code"
                />
              ) : (
                <div className="w-48 h-48 mx-auto bg-muted rounded-md flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-muted-foreground animate-pulse" />
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Scan to view room details and assigned employees
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyQRLink(qrRoom)}
                  data-testid="button-copy-qr-link"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/room/${qrRoom.qrHash}`, "_blank")}
                  data-testid="button-open-qr-page"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Open Page
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
