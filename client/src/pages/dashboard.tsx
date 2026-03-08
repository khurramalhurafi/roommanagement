import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DoorOpen,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  TrendingUp,
  Home,
  Wrench,
  MapPin,
} from "lucide-react";
import type { TransferLog } from "@shared/schema";

interface CabinBreakdown {
  id: number;
  name: string;
  location: string | null;
  status: string;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
}

interface DashboardStats {
  totalEmployees: number;
  totalCabins: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  recentTransfers: (TransferLog & {
    employeeName: string;
    fromRoom: string | null;
    toRoom: string | null;
  })[];
  cabinBreakdown: CabinBreakdown[];
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  color,
  testId,
}: {
  title: string;
  value: number;
  icon: any;
  href: string;
  color: string;
  testId: string;
}) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer hover-elevate transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <p className="text-3xl font-bold mt-1" data-testid={testId}>
                {value}
              </p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function OccupancyBar({ occupied, available, maintenance, total }: {
  occupied: number;
  available: number;
  maintenance: number;
  total: number;
}) {
  if (total === 0) return <div className="h-2 rounded-full bg-muted w-full" />;
  const occupiedPct = (occupied / total) * 100;
  const availablePct = (available / total) * 100;
  const maintenancePct = (maintenance / total) * 100;
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden flex">
      <div className="h-full bg-orange-500 transition-all" style={{ width: `${occupiedPct}%` }} />
      <div className="h-full bg-green-500 transition-all" style={{ width: `${availablePct}%` }} />
      <div className="h-full bg-yellow-400 transition-all" style={{ width: `${maintenancePct}%` }} />
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of accommodation system</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of accommodation management system
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees ?? 0}
          icon={Users}
          href="/employees"
          color="bg-primary/10 text-primary"
          testId="stat-total-employees"
        />
        <StatCard
          title="Total Cabins"
          value={stats?.totalCabins ?? 0}
          icon={Home}
          href="/porta-cabins"
          color="bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
          testId="stat-total-cabins"
        />
        <StatCard
          title="Total Rooms"
          value={stats?.totalRooms ?? 0}
          icon={DoorOpen}
          href="/rooms"
          color="bg-chart-2/10 text-chart-2"
          testId="stat-total-rooms"
        />
        <StatCard
          title="Occupied Rooms"
          value={stats?.occupiedRooms ?? 0}
          icon={CheckCircle2}
          href="/rooms?status=occupied"
          color="bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
          testId="stat-occupied-rooms"
        />
        <StatCard
          title="Available Rooms"
          value={stats?.availableRooms ?? 0}
          icon={XCircle}
          href="/rooms?status=available"
          color="bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400"
          testId="stat-available-rooms"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2 px-6 pt-5">
            <h3 className="font-semibold text-base">Overall Occupancy</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                  <span className="text-sm font-semibold">{stats?.occupancyRate ?? 0}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${stats?.occupancyRate ?? 0}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="text-center p-3 rounded-md bg-muted/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs text-muted-foreground">Occupied</span>
                  </div>
                  <p className="text-xl font-bold">{stats?.occupiedRooms ?? 0}</p>
                </div>
                <div className="text-center p-3 rounded-md bg-muted/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">Available</span>
                  </div>
                  <p className="text-xl font-bold">{stats?.availableRooms ?? 0}</p>
                </div>
                <div className="text-center p-3 rounded-md bg-muted/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="text-xs text-muted-foreground">Maintenance</span>
                  </div>
                  <p className="text-xl font-bold">
                    {(stats?.totalRooms ?? 0) - (stats?.occupiedRooms ?? 0) - (stats?.availableRooms ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2 px-6 pt-5">
            <h3 className="font-semibold text-base">Recent Transfers</h3>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {stats?.recentTransfers && stats.recentTransfers.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTransfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex items-center gap-3 p-3 rounded-md bg-muted/50"
                    data-testid={`transfer-log-${transfer.id}`}
                  >
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{transfer.employeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {transfer.fromRoom ?? "Unassigned"} → {transfer.toRoom ?? "Unassigned"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {transfer.transferredAt
                        ? new Date(transfer.transferredAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ArrowRightLeft className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent transfers</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cabin Breakdown */}
      {stats?.cabinBreakdown && stats.cabinBreakdown.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2 px-6 pt-5">
            <div>
              <h3 className="font-semibold text-base">Porta Cabin Status</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Room availability breakdown per cabin
              </p>
            </div>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex items-center gap-4 mb-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-orange-500" />
                <span className="text-muted-foreground">Occupied</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-green-500" />
                <span className="text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-yellow-400" />
                <span className="text-muted-foreground">Maintenance</span>
              </div>
            </div>
            <div className="space-y-4">
              {stats.cabinBreakdown.map((cabin) => {
                const occupancyPct = cabin.totalRooms > 0
                  ? Math.round((cabin.occupiedRooms / cabin.totalRooms) * 100)
                  : 0;
                return (
                  <div key={cabin.id} data-testid={`cabin-breakdown-${cabin.id}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{cabin.name}</span>
                        {cabin.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />{cabin.location}
                          </span>
                        )}
                        <Badge
                          variant={cabin.status === "active" ? "default" : "secondary"}
                          className="text-xs py-0"
                        >
                          {cabin.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-orange-500" />
                          {cabin.occupiedRooms} occ
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-green-500" />
                          {cabin.availableRooms} avail
                        </span>
                        {cabin.maintenanceRooms > 0 && (
                          <span className="flex items-center gap-1">
                            <Wrench className="h-3 w-3 text-yellow-500" />
                            {cabin.maintenanceRooms} maint
                          </span>
                        )}
                        <span className="font-semibold text-foreground">{occupancyPct}%</span>
                      </div>
                    </div>
                    <OccupancyBar
                      occupied={cabin.occupiedRooms}
                      available={cabin.availableRooms}
                      maintenance={cabin.maintenanceRooms}
                      total={cabin.totalRooms}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{cabin.totalRooms} total rooms</span>
                      <Link href={`/porta-cabins`}>
                        <span className="text-primary hover:underline cursor-pointer">Manage →</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
