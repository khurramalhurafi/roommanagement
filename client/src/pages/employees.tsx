import { useState, useRef } from "react";
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
  DialogDescription,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  ArrowRightLeft,
  Camera,
  X,
  Eye,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Building2,
  ChevronDown,
} from "lucide-react";
import type { Employee, Room, PortaCabin } from "@shared/schema";

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
  const [showDetails, setShowDetails] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [showDeptRename, setShowDeptRename] = useState(false);
  const [renamingDept, setRenamingDept] = useState<string>("");
  const [newDeptName, setNewDeptName] = useState<string>("");
  const [showDeptDelete, setShowDeptDelete] = useState(false);
  const [deletingDept, setDeletingDept] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const { data: cabins = [] } = useQuery<PortaCabin[]>({
    queryKey: ["/api/porta-cabins"],
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

  const renameDeptMutation = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      const res = await apiRequest("PATCH", "/api/departments/rename", { oldName, newName });
      return res.json();
    },
    onSuccess: (data, { oldName, newName }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      if (departmentFilter === oldName) setDepartmentFilter(newName);
      setShowDeptRename(false);
      setRenamingDept("");
      setNewDeptName("");
      toast({ title: `Department renamed to "${newName}"`, description: `${data.count} employees updated` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("DELETE", `/api/departments/${encodeURIComponent(name)}`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      if (departmentFilter === deletingDept) setDepartmentFilter("all");
      setShowDeptDelete(false);
      setDeletingDept("");
      toast({ title: "Department deleted", description: `${data.count} employees cleared` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handlePhotoUpload = async (employeeId: number, file: File) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(`/api/employees/${employeeId}/upload-photo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }
      const updated = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      if (detailEmployee?.id === employeeId) setDetailEmployee(updated);
      if (editingEmployee?.id === employeeId) setEditingEmployee(updated);
      toast({ title: "Profile picture uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async (employeeId: number) => {
    try {
      const res = await apiRequest("DELETE", `/api/employees/${employeeId}/photo`);
      const updated = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      if (detailEmployee?.id === employeeId) setDetailEmployee(updated);
      if (editingEmployee?.id === employeeId) setEditingEmployee(updated);
      toast({ title: "Profile picture removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

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

  const openCreate = (dept?: string) => {
    setEditingEmployee(null);
    form.reset({
      employeeIdNo: "",
      name: "",
      iqama: "",
      mobile: "",
      department: dept || (departmentFilter !== "all" ? departmentFilter : ""),
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

  const openDetails = (employee: Employee) => {
    setDetailEmployee(employee);
    setShowDetails(true);
  };

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean))).sort();

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeIdNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === "all" || e.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const deptParam = departmentFilter !== "all" ? `?department=${encodeURIComponent(departmentFilter)}` : "";
  const deptLabel = departmentFilter !== "all" ? departmentFilter.replace(/\s+/g, "_") : "all";

  const getCabinName = (portaCabinId: number | null | undefined) => {
    if (!portaCabinId) return null;
    return cabins.find(c => c.id === portaCabinId)?.name || null;
  };

  const getRoomLabel = (roomId: number | null) => {
    if (!roomId) return "Unassigned";
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return "Unknown";
    const cabinName = getCabinName(room.portaCabinId);
    return cabinName ? `${cabinName} — ${room.roomNumber}` : room.building ? `${room.building} — ${room.roomNumber}` : room.roomNumber;
  };

  const getRoomSelectLabel = (room: Room) => {
    const cabinName = getCabinName(room.portaCabinId);
    const prefix = cabinName || room.building || "";
    const floor = room.floor ? ` (Floor ${room.floor})` : "";
    return prefix ? `${prefix} — ${room.roomNumber}${floor}` : `${room.roomNumber}${floor}`;
  };

  const availableRooms = rooms.filter((r) => r.status === "available" || r.status === "occupied");

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Employees</h1>
          <p className="text-muted-foreground">Manage employee records and room assignments</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-export-employees">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                data-testid="button-export-employees-excel"
                onClick={() => handleExport(`/api/export/employees/excel${deptParam}`, `employees_${deptLabel}_${Date.now()}.xlsx`)}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export to Excel {departmentFilter !== "all" && `(${departmentFilter})`}
              </DropdownMenuItem>
              <DropdownMenuItem
                data-testid="button-export-employees-pdf"
                onClick={() => handleExport(`/api/export/employees/pdf${deptParam}`, `employees_${deptLabel}_${Date.now()}.pdf`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export to PDF {departmentFilter !== "all" && `(${departmentFilter})`}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => openCreate()} data-testid="button-add-employee">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Search + Department Filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-employees"
          />
        </div>
        {departments.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <button
              onClick={() => setDepartmentFilter("all")}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                departmentFilter === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
              data-testid="filter-dept-all"
            >
              All ({employees.length})
            </button>
            {departments.map(dept => {
              const count = employees.filter(e => e.department === dept).length;
              const isActive = departmentFilter === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setDepartmentFilter(isActive ? "all" : dept)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-accent"
                  }`}
                  data-testid={`filter-dept-${dept}`}
                >
                  {dept} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Department summary cards (only when showing all) */}
      {departmentFilter === "all" && departments.length > 0 && !isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {departments.map(dept => {
            const deptEmps = employees.filter(e => e.department === dept);
            const assignedCount = deptEmps.filter(e => e.roomId !== null).length;
            return (
              <Card
                key={dept}
                className="hover-elevate border-l-4 border-l-primary/50"
                data-testid={`card-dept-${dept}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <button
                      className="text-xs font-medium leading-tight line-clamp-2 text-left hover:text-primary"
                      onClick={() => setDepartmentFilter(dept)}
                    >
                      {dept}
                    </button>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                        onClick={e => { e.stopPropagation(); setRenamingDept(dept); setNewDeptName(dept); setShowDeptRename(true); }}
                        title="Rename department"
                        data-testid={`button-rename-dept-${dept}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-destructive"
                        onClick={e => { e.stopPropagation(); setDeletingDept(dept); setShowDeptDelete(true); }}
                        title="Delete department"
                        data-testid={`button-delete-dept-${dept}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <button className="w-full text-left" onClick={() => setDepartmentFilter(dept)}>
                    <p className="text-xl font-bold">{deptEmps.length}</p>
                    <p className="text-xs text-muted-foreground">{assignedCount} assigned</p>
                  </button>
                  <button
                    className="mt-2 text-xs text-primary hover:underline flex items-center gap-0.5"
                    onClick={e => { e.stopPropagation(); openCreate(dept); }}
                    data-testid={`button-add-to-dept-${dept}`}
                  >
                    <Plus className="h-3 w-3" />Add employee
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Active department header */}
      {departmentFilter !== "all" && (
        <div className="flex items-center justify-between p-3 rounded-md bg-primary/5 border border-primary/20 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Department: {departmentFilter}</span>
            <Badge variant="secondary">{filteredEmployees.length} employees</Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => openCreate(departmentFilter)} data-testid="button-add-to-active-dept">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Employee
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setRenamingDept(departmentFilter); setNewDeptName(departmentFilter); setShowDeptRename(true); }}
              data-testid="button-rename-active-dept"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Rename
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => { setDeletingDept(departmentFilter); setShowDeptDelete(true); }}
              data-testid="button-delete-active-dept"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
            <button
              onClick={() => setDepartmentFilter("all")}
              className="text-xs text-muted-foreground hover:text-foreground"
              data-testid="button-clear-dept-filter"
            >
              ✕ Clear filter
            </button>
          </div>
        </div>
      )}

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
              {searchTerm
                ? "Try adjusting your search"
                : departmentFilter !== "all"
                ? `No employees in the ${departmentFilter} department yet`
                : "Add your first employee to get started"}
            </p>
            {departmentFilter !== "all" && !searchTerm && (
              <Button size="sm" className="mt-3" onClick={() => openCreate(departmentFilter)}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add to {departmentFilter}
              </Button>
            )}
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
                  <TableHead className="hidden lg:table-cell">Cabin / Room</TableHead>
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
                            {getInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          className="font-medium text-left hover:underline cursor-pointer"
                          onClick={() => openDetails(employee)}
                          data-testid={`link-employee-name-${employee.id}`}
                        >
                          {employee.name}
                        </button>
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
                          onClick={() => openDetails(employee)}
                          data-testid={`button-view-employee-${employee.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {detailEmployee && (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={detailEmployee.profileImage || undefined} />
                    <AvatarFallback className="text-2xl">
                      {getInitials(detailEmployee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-1 mt-2 justify-center">
                    <input
                      ref={detailFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(detailEmployee.id, file);
                        e.target.value = "";
                      }}
                      data-testid="input-detail-photo-upload"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => detailFileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      data-testid="button-detail-upload-photo"
                    >
                      <Camera className="h-3.5 w-3.5 mr-1" />
                      {uploadingPhoto ? "Uploading..." : detailEmployee.profileImage ? "Change Photo" : "Upload Photo"}
                    </Button>
                    {detailEmployee.profileImage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemovePhoto(detailEmployee.id)}
                        data-testid="button-detail-remove-photo"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold" data-testid="text-detail-name">
                    {detailEmployee.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{detailEmployee.employeeIdNo}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="text-sm font-medium">{detailEmployee.department}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="text-sm font-medium">{detailEmployee.company}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">Iqama Number</p>
                  <p className="text-sm font-medium">{detailEmployee.iqama}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">Mobile</p>
                  <p className="text-sm font-medium">{detailEmployee.mobile}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50 col-span-2">
                  <p className="text-xs text-muted-foreground">Cabin / Room</p>
                  <p className="text-sm font-medium">{getRoomLabel(detailEmployee.roomId)}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={detailEmployee.status === "active" ? "default" : "secondary"}>
                    {detailEmployee.status}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setShowDetails(false); openEdit(detailEmployee); }}
                  data-testid="button-detail-edit"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setShowDetails(false); openTransfer(detailEmployee); }}
                  data-testid="button-detail-transfer"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                  Transfer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Edit Employee" : "Add New Employee"}
            </DialogTitle>
          </DialogHeader>

          {editingEmployee && (
            <div className="flex items-center gap-4 p-4 rounded-md bg-muted/50">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={editingEmployee.profileImage || undefined} />
                  <AvatarFallback className="text-lg">
                    {getInitials(editingEmployee.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Profile Picture</p>
                <div className="flex gap-2 flex-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && editingEmployee) handlePhotoUpload(editingEmployee.id, file);
                      e.target.value = "";
                    }}
                    data-testid="input-photo-upload"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    data-testid="button-upload-photo"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                  </Button>
                  {editingEmployee.profileImage && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemovePhoto(editingEmployee.id)}
                      data-testid="button-remove-photo"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">JPG or PNG, max 2MB</p>
              </div>
            </div>
          )}

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
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
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
              <form onSubmit={transferForm.handleSubmit(onTransfer)} className="space-y-4">
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
                          {getRoomSelectLabel(room)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowTransfer(false)}>
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

      {/* Rename Department Dialog */}
      <Dialog open={showDeptRename} onOpenChange={open => { setShowDeptRename(open); if (!open) { setRenamingDept(""); setNewDeptName(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Department</DialogTitle>
            <DialogDescription>
              Rename "<span className="font-medium">{renamingDept}</span>" — all employees in this department will be updated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">New Department Name</label>
              <Input
                value={newDeptName}
                onChange={e => setNewDeptName(e.target.value)}
                placeholder="Enter new name..."
                data-testid="input-dept-rename"
                onKeyDown={e => { if (e.key === "Enter" && newDeptName.trim() && newDeptName.trim() !== renamingDept) renameDeptMutation.mutate({ oldName: renamingDept, newName: newDeptName.trim() }); }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeptRename(false)} data-testid="button-cancel-rename">Cancel</Button>
              <Button
                onClick={() => renameDeptMutation.mutate({ oldName: renamingDept, newName: newDeptName.trim() })}
                disabled={!newDeptName.trim() || newDeptName.trim() === renamingDept || renameDeptMutation.isPending}
                data-testid="button-confirm-rename"
              >
                {renameDeptMutation.isPending ? "Renaming..." : "Rename"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Department Confirmation */}
      <Dialog open={showDeptDelete} onOpenChange={open => { setShowDeptDelete(open); if (!open) setDeletingDept(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "<span className="font-medium">{deletingDept}</span>"?{" "}
              {employees.filter(e => e.department === deletingDept).length > 0
                ? `${employees.filter(e => e.department === deletingDept).length} employee(s) will have their department cleared.`
                : "No employees are currently in this department."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeptDelete(false)} data-testid="button-cancel-delete-dept">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteDeptMutation.mutate(deletingDept)}
              disabled={deleteDeptMutation.isPending}
              data-testid="button-confirm-delete-dept"
            >
              {deleteDeptMutation.isPending ? "Deleting..." : "Delete Department"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
