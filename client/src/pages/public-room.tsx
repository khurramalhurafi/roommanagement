import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  DoorOpen,
  Layers,
  Users,
} from "lucide-react";
import type { Room, Employee } from "@shared/schema";

interface PublicRoomData {
  room: Room;
  employees: Pick<Employee, "id" | "name" | "employeeIdNo" | "company" | "department" | "profileImage">[];
}

export default function PublicRoomPage() {
  const [, params] = useRoute("/room/:hash");
  const hash = params?.hash;

  const { data, isLoading, error } = useQuery<PublicRoomData>({
    queryKey: ["/api/public/room", hash],
    enabled: !!hash,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6 pt-8">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <DoorOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h2 className="text-xl font-semibold">Room Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The room you're looking for doesn't exist or the link is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { room, employees } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-primary-foreground/10 mb-4">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold" data-testid="text-room-title">
            Room {room.roomNumber}
          </h1>
          <p className="text-primary-foreground/80 mt-1">{room.building}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-12">
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <Layers className="h-4 w-4" />
                  <span className="text-xs font-medium">Floor</span>
                </div>
                <p className="font-semibold" data-testid="text-room-floor">{room.floor}</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">Capacity</span>
                </div>
                <p className="font-semibold" data-testid="text-room-capacity">{room.capacity}</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <DoorOpen className="h-4 w-4" />
                  <span className="text-xs font-medium">Status</span>
                </div>
                <Badge variant={room.status === "available" ? "default" : "secondary"}>
                  {room.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          Assigned Employees ({employees.length})
        </h2>

        {employees.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {employees.map((emp) => (
              <Card key={emp.id} data-testid={`card-employee-${emp.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={emp.profileImage || undefined} />
                      <AvatarFallback>
                        {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate" data-testid={`text-employee-name-${emp.id}`}>
                        {emp.name}
                      </p>
                      <p className="text-xs text-muted-foreground">ID: {emp.employeeIdNo}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {emp.company} - {emp.department}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground">No employees assigned to this room</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
