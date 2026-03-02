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
  Users,
  ArrowRightLeft,
} from "lucide-react";
import type { Employee, Room } from "@shared/schema";

const employeeFormSchema = z.object({
  employeeIdNo: z.string().min(1, "Employee ID is required"),
  name: z.string().min(1, "Name is required"),
  iqama: z.string().min(1, "Iqama number is required"),
  mobile: z.string().min(1, "Mobile number is required"),
  department: z.string().min(1, "Department is required"),
  company: z.string().min(1, "Company name is required"),
  status: z.string().default("active"),
  roomId: z.number().nullable().optional(),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

export default function EmployeesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferEmployee, setTransferEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employeeIdNo: "",
      name: "",
      iqama: "",
      mobile: "",
      department: "",
      company: "",
      status: "active",
      roomId: null,
    },
  });

  const transferForm = useForm<{ roomId: number | null }>({
    defaultValues: { roomId: null },
  });

  const createMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const res = await apiRequest("POST", "/api/employees", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setShowForm(false);
      form.reset();
      toast({ title: "Employee created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EmployeeFormData & { id: number }) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PATCH", `/api/employees/${id}`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setShowForm(false);
      setEditingEmployee(null);
      form.reset();
      toast({ title: "Employee updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({ title: "Employee deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async ({ employeeId, roomId }: { employeeId: number; roomId: number | null }) => {
      const res = await apiRequest("POST", `/api/employees/${employeeId}/transfer`, { roomId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setShowTransfer(false);
      setTransferEmployee(null);
      toast({ title: "Employee transferred successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.reset({
      employeeIdNo: employee.employeeIdNo,
      name: employee.name,
      iqama: employee.iqama,
      mobile: employee.mobile,
      department: employee.department,
      company: employee.company,
      status: employee.status,
      roomId: employee.roomId,
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingEmployee(null);
    form.reset({
      employeeIdNo: "",
      name: "",
      iqama: "",
      mobile: "",
      department: "",
      company: "",
      status: "active",
      roomId: null,
    });
    setShowForm(true);
  };

  const onSubmit = (data: EmployeeFormData) => {
    if (editingEmployee) {
      updateMutation.mutate({ ...data, id: editingEmployee.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const openTransfer = (employee: Employee) => {
    setTransferEmployee(employee);
    transferForm.reset({ roomId: employee.roomId });
    setShowTransfer(true);
  };

  const onTransfer = (data: { roomId: number | null }) => {
    if (transferEmployee) {
      transferMutation.mutate({ employeeId: transferEmployee.id, roomId: data.roomId });
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeIdNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoomLabel = (roomId: number | null) => {
    if (!roomId) return "Unassigned";
    const room = rooms.find((r) => r.id === roomId);
    return room ? `${room.roomNumber} - ${room.building}` : "Unknown";
  };

  const availableRooms = rooms.filter((r) => r.status === "available" || r.status === "occupied");

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Employees</h1>
          <p className="text-muted-foreground">
            Manage employee records and room assignments
          </p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-employee">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-employees"
        />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading employees...</p>
          </CardContent>
        </Card>
      ) : filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">No employees found</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm ? "Try adjusting your search" : "Add your first employee to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>ID No</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="hidden md:table-cell">Company</TableHead>
                  <TableHead className="hidden lg:table-cell">Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={employee.profileImage || undefined} />
                          <AvatarFallback className="text-xs">
                            {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{employee.employeeIdNo}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {employee.department}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {employee.company}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={employee.roomId ? "secondary" : "outline"}>
                        {getRoomLabel(employee.roomId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openTransfer(employee)}
                          data-testid={`button-transfer-${employee.id}`}
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(employee)}
                          data-testid={`button-edit-employee-${employee.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this employee?")) {
                              deleteMutation.mutate(employee.id);
                            }
                          }}
                          data-testid={`button-delete-employee-${employee.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Edit Employee" : "Add New Employee"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employeeIdNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee ID</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-employee-id" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-employee-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="iqama"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Iqama Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-iqama" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-mobile" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-department" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-company" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-employee"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingEmployee
                    ? "Update Employee"
                    : "Create Employee"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Employee</DialogTitle>
          </DialogHeader>
          {transferEmployee && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Transfer <span className="font-medium text-foreground">{transferEmployee.name}</span> to a new room.
                Currently: <Badge variant="outline">{getRoomLabel(transferEmployee.roomId)}</Badge>
              </p>
              <form
                onSubmit={transferForm.handleSubmit(onTransfer)}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">New Room</label>
                  <Select
                    onValueChange={(v) =>
                      transferForm.setValue("roomId", v === "unassigned" ? null : Number(v))
                    }
                    defaultValue={transferEmployee.roomId?.toString() || "unassigned"}
                  >
                    <SelectTrigger data-testid="select-transfer-room">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          {room.roomNumber} - {room.building} (Floor {room.floor})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTransfer(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={transferMutation.isPending}
                    data-testid="button-confirm-transfer"
                  >
                    {transferMutation.isPending ? "Transferring..." : "Transfer"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
