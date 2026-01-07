import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
// Re-import Navbar
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard,
  MapPin,
  FileText,
  Users,
  BarChart3,
  Settings,
  Bell,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  MoreVertical,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Mock data removed. dynamic stats used.

// Sidebar items - Removed Home/Map as they are in Navbar now
const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin", active: true },
  { icon: MapPin, label: "Map View", href: "/admin/map" },
  { icon: FileText, label: "Manage Issues", href: "/admin/issues" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const statusConfig: Record<string, { label: string; class: string }> = {
  pending: { label: "Pending", class: "status-pending" },
  "in-progress": { label: "In Progress", class: "status-in-progress" },
  resolved: { label: "Resolved", class: "status-resolved" },
  escalated: { label: "Escalated", class: "status-escalated" },
};

const priorityConfig: Record<string, { label: string; class: string }> = {
  low: { label: "Low", class: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", class: "bg-warning/20 text-warning" },
  high: { label: "High", class: "bg-destructive/20 text-destructive" },
  critical: {
    label: "Critical",
    class: "bg-destructive text-destructive-foreground",
  },
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [issues, setIssues] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolvedToday: 0,
    slaBreaches: 0,
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/issues/all");
        if (response.ok) {
          const data = await response.json();
          let allIssues = data.issues || [];

          // Department Filtering Logic
          if (user?.department && user.department.toLowerCase() !== "admin") {
            const dept = user.department.toLowerCase();
            allIssues = allIssues.filter((issue: any) => {
              const cat = (issue.category || "").toLowerCase();
              if (
                dept.includes("road") &&
                (cat.includes("pothole") || cat.includes("road"))
              )
                return true;
              if (
                dept.includes("sanitation") &&
                (cat.includes("garbage") || cat.includes("waste"))
              )
                return true;
              if (
                dept.includes("water") &&
                (cat.includes("water") || cat.includes("drainage"))
              )
                return true;
              if (
                dept.includes("electric") &&
                (cat.includes("light") || cat.includes("electric"))
              )
                return true;
              return false;
            });
          }

          setIssues(allIssues);

          // Calculate Stats
          const pending = allIssues.filter(
            (i: any) => i.status === "pending" || i.status === "escalated"
          ).length;
          const inProgress = allIssues.filter(
            (i: any) => i.status === "in-progress"
          ).length;

          const today = new Date().toDateString();
          const resolved = allIssues.filter(
            (i: any) => i.status === "resolved"
          ).length; // accurate enough for now, ideal would be checking updatedAt

          setStats({
            total: allIssues.length,
            pending,
            inProgress,

            resolvedToday: resolved,
            slaBreaches: allIssues.filter((i: any) => i.slaStatus === "BREACHED").length,
          });
        }
      } catch (error) {
        console.error("Failed to fetch issues", error);
      }
    };

    if (user) fetchIssues();
  }, [user]);

  const statCards = [
    {
      label: "Total Issues",
      value: stats.total.toLocaleString(),
      change: "+0%", // Dynamic change requires history, keeping static for now or 0
      icon: FileText,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Pending",
      value: stats.pending.toLocaleString(),
      change: "Active",
      icon: Clock,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "In Progress",
      value: stats.inProgress.toLocaleString(),
      change: "Active",
      icon: TrendingUp,
      color: "bg-info/10 text-info",
    },
    {
      label: "Resolved",
      value: stats.resolvedToday.toLocaleString(),
      change: "Total",
      icon: CheckCircle2,
      color: "bg-success/10 text-success",
    },
    {
      label: "SLA Breaches",
      value: stats.slaBreaches.toLocaleString(),
      change: "Critical",
      icon: AlertTriangle,
      color: "bg-destructive/10 text-destructive",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Restored Public Navbar */}

      <div className="flex pt-16 h-screen overflow-hidden">
        {/* Sidebar - Full Height minus navbar */}
        <aside className="hidden lg:flex w-72 flex-col fixed left-0 top-16 bottom-0 bg-card border-r border-border/50">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center shadow-md">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg text-foreground leading-none">
                  Civ<span className="text-primary">Setu</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                  Admin Portal
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {sidebarItems.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href === "/admin" && location.pathname === "/admin");
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-base font-medium transition-all group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-6 h-6",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border/50 flex flex-col items-center text-center opacity-50 hover:opacity-100 transition-opacity">
            <p className="text-xs text-muted-foreground">
              Municipal Control Center v1.0
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-72 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="h-20 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-between px-8 shrink-0 z-10">
            <div className="flex items-center gap-4">{/* Placehold */}</div>
            <div className="flex items-center gap-6">
              <div className="text-sm font-medium mr-4">
                {user?.department || "Admin"} Department
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Overview
                </h2>
                <p className="text-muted-foreground mt-1 text-base">
                  Real-time municipal operations overview
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center bg-background border border-border/50",
                        stat.color
                      )}
                    >
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="font-display text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Issues Table */}
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm min-h-[300px]">
              <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-display text-lg font-bold">
                  Recent Issues
                </h3>
              </div>

              <div className="w-full h-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p>No recent issues to display here.</p>
                <p className="text-sm mt-1">
                  Please go to "Manage Issues" to see the full list.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
