import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import EmployeesPage from "@/pages/employees";
import RoomsPage from "@/pages/rooms";
import UsersManagementPage from "@/pages/users-management";
import PublicRoomPage from "@/pages/public-room";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

function AuthenticatedRouter({ user }: { user: User }) {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/employees" component={EmployeesPage} />
      <Route path="/rooms" component={RoomsPage} />
      {user.role === "admin" && <Route path="/users" component={UsersManagementPage} />}
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout({ user }: { user: User }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={user} />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 p-3 border-b h-14 shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-hidden">
            <AuthenticatedRouter user={user} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="space-y-3 text-center">
          <Skeleton className="h-12 w-12 rounded-xl mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/room/:hash" component={PublicRoomPage} />
      <Route>
        {user ? <AuthenticatedLayout user={user} /> : <LoginPage />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
