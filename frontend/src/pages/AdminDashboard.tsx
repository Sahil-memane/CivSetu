import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar"; // Re-import Navbar
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

// Mock admin stats
const stats = [
  {
    label: "Total Issues",
    value: "1,247",
    change: "+12%",
    icon: FileText,
    color: "bg-primary/10 text-primary",
  },
  {
    label: "Pending",
    value: "234",
    change: "-5%",
    icon: Clock,
    color: "bg-warning/10 text-warning",
  },
  {
    label: "In Progress",
    value: "156",
    change: "+8%",
    icon: TrendingUp,
    color: "bg-info/10 text-info",
  },
  {
    label: "Resolved Today",
    value: "45",
    change: "+23%",
    icon: CheckCircle2,
    color: "bg-success/10 text-success",
  },
];

// Mock issues for admin
const adminIssues = [
  {
    id: "ISS-001",
    title: "Large Pothole Near Market",
    category: "Pothole",
    location: "MG Road, Sector 5",
    reportedBy: "Rahul S.",
    reportedAt: "2 hours ago",
    status: "pending",
    priority: "high",
    verifications: 12,
    department: "Roads",
  },
  {
    id: "ISS-002",
    title: "Garbage Overflow - Critical",
    category: "Garbage",
    location: "Rajiv Chowk, Lane 4",
    reportedBy: "Priya M.",
    reportedAt: "3 hours ago",
    status: "escalated",
    priority: "critical",
    verifications: 25,
    department: "Sanitation",
  },
  {
    id: "ISS-003",
    title: "Street Light Not Working",
    category: "Street Light",
    location: "Gandhi Nagar, Block B",
    reportedBy: "Amit K.",
    reportedAt: "5 hours ago",
    status: "in-progress",
    priority: "medium",
    verifications: 8,
    department: "Electrical",
  },
  {
    id: "ISS-004",
    title: "Water Pipeline Leak",
    category: "Water",
    location: "Station Road",
    reportedBy: "Sunita R.",
    reportedAt: "1 day ago",
    status: "in-progress",
    priority: "high",
    verifications: 15,
    department: "Water Supply",
  },
];

// Sidebar items - Removed Home/Map as they are in Navbar now
const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin", active: true },
  { icon: FileText, label: "Manage Issues", href: "/admin/issues" },
  { icon: Users, label: "Citizens", href: "/admin/citizens" },
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
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Restored Public Navbar */}
      <Navbar />

      <div className="flex pt-16 h-screen overflow-hidden">
        {/* Sidebar - Full Height minus navbar */}
        <aside className="hidden lg:flex w-72 flex-col fixed left-0 top-16 bottom-0 bg-card border-r border-border/50">
          {/* Top Logo Section (Replaces Profile) */}
          <div className="p-6 border-b border-border/50">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center shadow-md">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                Civ<span className="text-primary">Setu</span>
                <span className="text-xs font-normal text-muted-foreground ml-2 bg-muted px-2 py-0.5 rounded-full">
                  Admin
                </span>
              </span>
            </Link>
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
            <div className="flex items-center gap-4">
              {/* Mobile sidebar toggle would go here */}
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search system..."
                  className="pl-10 w-64 h-9 bg-background"
                />
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" /> Filter
                </Button>
                <Button variant="hero" size="sm" className="gap-2">
                  <ArrowUpRight className="w-4 h-4" /> Export Report
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => (
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
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs font-medium gap-1",
                        stat.change.startsWith("+")
                          ? "text-success bg-success/10"
                          : "text-destructive bg-destructive/10"
                      )}
                    >
                      {stat.change}
                    </Badge>
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
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-display text-lg font-bold">
                  Recent Issues
                </h3>
                <div className="flex items-center gap-3">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32 h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Status: All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Dept: All</SelectItem>
                      <SelectItem value="roads">Roads</SelectItem>
                      <SelectItem value="water">Water Supply</SelectItem>
                      <SelectItem value="sanitation">Sanitation</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 border-b border-border/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Issue Details
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Location
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Department
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {adminIssues.map((issue) => (
                      <tr
                        key={issue.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => setSelectedIssue(issue.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                              {issue.title}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Clock className="w-3 h-3" /> {issue.reportedAt} •{" "}
                              <span className="font-mono">{issue.id}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            {issue.location}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary/40"></div>
                            <span className="text-sm font-medium">
                              {issue.department}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs border-0 font-medium",
                              statusConfig[issue.status].class
                            )}
                          >
                            {statusConfig[issue.status].label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-medium",
                              priorityConfig[issue.priority].class
                            )}
                          >
                            {priorityConfig[issue.priority].label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-border/50 flex items-center justify-between bg-muted/10">
                <span className="text-xs text-muted-foreground">
                  Showing <strong>4</strong> of <strong>234</strong> issues
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    disabled
                  >
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
