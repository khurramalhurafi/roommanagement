import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
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
} from "lucide-react";
import type { PortaCabin, Room, Employee } from "@shared/schema";

const cabinFormSchema = z.object({
  name: z.string().min(1, "Cabin name is required"),
  location: z.string().optional(),
  status: z.string().default("active"),
});

type CabinFormData = z.infer<typeof cabinFormSchema>;

function CabinMapCard({ cabin, rooms, employees }: { cabin: PortaCabin; rooms: Room[]; employees: Employee[] }) {
  const [expanded, setExpanded] = useState(false);
  const cabinRooms = rooms.filter(r => r.portaCabinId === cabin.id);

  return (
    <Card className="border-l-4 border-l-primary" data-testid={`card-cabin-map-${cabin.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            <span className="font-semibold">{cabin.name}</span>
            {cabin.location && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />{cabin.location}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={cabin.status === "active" ? "default" : "secondary"}>{cabin.status}</Badge>
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

        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
          <div className="p-2 rounded bg-muted/50">
            <p className="font-bold text-base">{cabinRooms.length}</p>
            <p className="text-muted-foreground">Total Rooms</p>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <p className="font-bold text-base">{cabinRooms.filter(r => r.status === "occupied").length}</p>
            <p className="text-muted-foreground">Occupied</p>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <p className="font-bold text-base">{cabinRooms.filter(r => r.status === "available").length}</p>
            <p className="text-muted-foreground">Available</p>
          </div>
        </div>

        {expanded && cabinRooms.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 border-t pt-3">
            {cabinRooms.map(room => {
              const occupants = employees.filter(e => e.roomId === room.id).length;
              const occupancyPercent = room.capacity > 0 ? Math.round((occupants / room.capacity) * 100) : 0;
              const isFull = occupants >= room.capacity;
              return (
                <div
                  key={room.id}
                  className={`p-2 rounded border text-xs ${isFull ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20" : "border-border bg-muted/30"}`}
                  data-testid={`room-map-cell-${room.id}`}
                >
                  <p className="font-semibold">{room.roomNumber}</p>
                  <p className="text-muted-foreground">{occupants}/{room.capacity}</p>
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
          <p className="text-xs text-muted-foreground text-center py-2 border-t mt-2">No rooms assigned to this cabin</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function PortaCabinsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingCabin, setEditingCabin] = useState<PortaCabin | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMap, setShowMap] = useState(false);
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

  const form = useForm<CabinFormData>({
    resolver: zodResolver(cabinFormSchema),
    defaultValues: { name: "", location: "", status: "active" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CabinFormData) => {
      const res = await apiRequest("POST", "/api/porta-cabins", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/porta-cabins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowForm(false);
      form.reset();
      toast({ title: "Porta Cabin created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CabinFormData & { id: number }) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PATCH", `/api/porta-cabins/${id}`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/porta-cabins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowForm(false);
      setEditingCabin(null);
      form.reset();
      toast({ title: "Porta Cabin updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/porta-cabins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/porta-cabins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Porta Cabin deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (cabin: PortaCabin) => {
    setEditingCabin(cabin);
    form.reset({ name: cabin.name, location: cabin.location || "", status: cabin.status });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingCabin(null);
    form.reset({ name: "", location: "", status: "active" });
    setShowForm(true);
  };

  const onSubmit = (data: CabinFormData) => {
    if (editingCabin) {
      updateMutation.mutate({ ...data, id: editingCabin.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredCabins = cabins.filter(
    c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.location || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoomCount = (cabinId: number) => rooms.filter(r => r.portaCabinId === cabinId).length;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Porta Cabins</h1>
          <p className="text-muted-foreground">Manage accommodation porta cabins</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowMap(!showMap)}
            data-testid="button-toggle-map"
          >
            {showMap ? "List View" : "Cabin Map"}
          </Button>
          <Button onClick={openCreate} data-testid="button-add-cabin">
            <Plus className="h-4 w-4 mr-2" />
            Add Cabin
          </Button>
        </div>
      </div>

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
              {filteredCabins.map(cabin => (
                <CabinMapCard key={cabin.id} cabin={cabin} rooms={rooms} employees={employees} />
              ))}
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCabins.map(cabin => (
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

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <DoorOpen className="h-4 w-4" />
                    <span>{getRoomCount(cabin.id)} Rooms</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    data-testid={`button-view-cabin-rooms-${cabin.id}`}
                  >
                    <Link href={`/rooms?cabinId=${cabin.id}`}>
                      <DoorOpen className="h-3.5 w-3.5 mr-1" />
                      View Rooms
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(cabin)}
                    data-testid={`button-edit-cabin-${cabin.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${cabin.name}"?`)) {
                        deleteMutation.mutate(cabin.id);
                      }
                    }}
                    data-testid={`button-delete-cabin-${cabin.id}`}
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
            <DialogTitle>{editingCabin ? "Edit Porta Cabin" : "Add New Porta Cabin"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-cabin"
                >
                  {createMutation.isPending || updateMutation.isPending
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
    </div>
  );
}
