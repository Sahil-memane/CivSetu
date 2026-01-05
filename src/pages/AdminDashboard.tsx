import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LayoutDashboard, MapPin, FileText, Users, BarChart3, Settings, 
  Bell, Search, Filter, Clock, CheckCircle2, AlertTriangle, TrendingUp,
  ArrowUpRight, MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock admin stats
const stats = [
  { label: "Total Issues", value: "1,247", change: "+12%", icon: FileText, color: "bg-primary/10 text-primary" },
  { label: "Pending", value: "234", change: "-5%", icon: Clock, color: "bg-warning/10 text-warning" },
  { label: "In Progress", value: "156", change: "+8%", icon: TrendingUp, color: "bg-info/10 text-info" },
  { label: "Resolved Today", value: "45", change: "+23%", icon: CheckCircle2, color: "bg-success/10 text-success" },
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

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: FileText, label: "Issues" },
  { icon: MapPin, label: "Map View" },
  { icon: Users, label: "Citizens" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Bell, label: "Notifications" },
  { icon: Settings, label: "Settings" },
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
  critical: { label: "Critical", class: "bg-destructive text-destructive-foreground" },
};

const AdminDashboard = () => {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col fixed left-0 top-16 bottom-0 bg-card border-r border-border/50 p-4">
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </div>

          {/* SLA Warning */}
          <div className="mt-auto p-4 bg-destructive/10 rounded-xl border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold text-sm">SLA Breach Alert</span>
            </div>
            <p className="text-xs text-muted-foreground">
              5 issues are approaching SLA deadline. Immediate action required.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Municipal Corporation Control Center</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search issues..." className="pl-10 w-64" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card rounded-2xl border border-border/50 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.color)}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-xs gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    {stat.change}
                  </Badge>
                </div>
                <div className="font-display text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Issues Table */}
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="font-display text-lg font-bold">Recent Issues</h2>
                <div className="flex items-center gap-3">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="roads">Roads</SelectItem>
                      <SelectItem value="water">Water Supply</SelectItem>
                      <SelectItem value="sanitation">Sanitation</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issue</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reported</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {adminIssues.map((issue) => (
                    <tr 
                      key={issue.id} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedIssue(issue.id)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-sm">{issue.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {issue.id} • {issue.category} • {issue.verifications} verifications
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {issue.location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{issue.department}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn("text-xs", statusConfig[issue.status].class)}>
                          {statusConfig[issue.status].label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn("text-xs", priorityConfig[issue.priority].class)}>
                          {priorityConfig[issue.priority].label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-muted-foreground">{issue.reportedAt}</div>
                        <div className="text-xs text-muted-foreground">by {issue.reportedBy}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-border/50 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Showing 1-4 of 234 issues</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
