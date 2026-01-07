import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  MapPin,
  FileText,
  Users,
  BarChart3,
  Settings,
  Search,
  Filter,
  Clock,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

import { IssueDetailModal } from "@/components/issues/IssueDetailModal";
import { ResolutionModal } from "@/components/issues/ResolutionModal";
import { PlanningModal } from "@/components/issues/PlanningModal";
import { RejectionModal } from "@/components/issues/RejectionModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  {
    icon: FileText,
    label: "Manage Issues",
    href: "/admin/issues",
    active: true,
  },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const statusConfig: Record<string, { label: string; class: string }> = {
  pending: {
    label: "Pending",
    class: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  },
  "in-progress": {
    label: "In Progress",
    class: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  resolved: {
    label: "Resolved",
    class: "bg-green-500/10 text-green-600 border-green-200",
  },
  escalated: {
    label: "Escalated",
    class: "bg-red-500/10 text-red-600 border-red-200",
  },
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

const ManageIssues = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [allDepartmentIssues, setAllDepartmentIssues] = useState<any[]>([]); // Store raw fetched data
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "pending" | "in-progress" | "resolved"
  >("pending");

  // Modal States
  const [detailsIssue, setDetailsIssue] = useState<any | null>(null);
  const [planningIssue, setPlanningIssue] = useState<any | null>(null);
  const [resolveIssue, setResolveIssue] = useState<any | null>(null);
  const [rejectIssue, setRejectIssue] = useState<any | null>(null);

  // Sorting Priority Map
  const priorityMap: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/issues/all");
        if (response.ok) {
          const data = await response.json();
          let fetched = data.issues || [];

          // Department Filtering Logic
          if (user?.department && user.department.toLowerCase() !== "admin") {
            const dept = user.department.toLowerCase();
            fetched = fetched.filter((issue: any) => {
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

          // Initial Sort by Priority
          fetched.sort((a: any, b: any) => {
            const pA = priorityMap[a.priority?.toLowerCase()] ?? 99;
            const pB = priorityMap[b.priority?.toLowerCase()] ?? 99;
            return pA - pB;
          });

          setAllDepartmentIssues(fetched);
        }
      } catch (error) {
        console.error("Failed to fetch issues", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchIssues();
  }, [user]);

  // Derived Filtered List
  const filteredIssues = allDepartmentIssues
    .filter((issue) => {
      // 1. Search Filter
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        const matchesSearch =
          issue.title?.toLowerCase().includes(lowerQ) ||
          issue.location?.toLowerCase().includes(lowerQ) ||
          issue.category?.toLowerCase().includes(lowerQ) ||
          issue.id?.toLowerCase().includes(lowerQ);
        if (!matchesSearch) return false;
      }

      // 2. Tab Filter
      const s = issue.status?.toLowerCase();
      if (activeTab === "pending") {
        return s === "pending" || s === "escalated";
      } else if (activeTab === "in-progress") {
        return s === "in-progress" || s === "assigned";
      } else if (activeTab === "resolved") {
        return s === "resolved";
      }
      return true;
    })
    .sort((a, b) => {
      const pA = priorityMap[a.priority?.toLowerCase()] ?? 99;
      const pB = priorityMap[b.priority?.toLowerCase()] ?? 99;
      return pA - pB;
    });

  const { toast } = useToast();

  const handlePlanConfirm = async (formData: FormData) => {
    if (!planningIssue) return;

    const previousIssues = [...allDepartmentIssues];
    // Convert FormData entries to object for optimistic update (simplified)
    const updates = Object.fromEntries(formData.entries());

    const updatedIssues = allDepartmentIssues.map((i) =>
      i.id === planningIssue.id
        ? { ...i, status: "in-progress", ...updates }
        : i
    );
    setAllDepartmentIssues(updatedIssues);

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `http://localhost:5000/api/issues/${planningIssue.id}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to plan issue");
      }

      toast({
        title: "Success",
        description: "Issue status updated to In Progress",
      });
    } catch (e) {
      console.error("Failed to plan issue", e);
      setAllDepartmentIssues(previousIssues);
      toast({
        title: "Error",
        description: "Failed to update issue status",
        variant: "destructive",
      });
    }
  };

  const handleResolveConfirm = async (formData: FormData) => {
    if (!resolveIssue) return;

    const previousIssues = [...allDepartmentIssues];
    // Optimistic Update
    const updatedIssues = allDepartmentIssues.map((i) =>
      i.id === resolveIssue.id ? { ...i, status: "resolved" } : i
    );
    setAllDepartmentIssues(updatedIssues);

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `http://localhost:5000/api/issues/${resolveIssue.id}/resolve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to resolve on backend");
      }

      toast({
        title: "Resolved",
        description: "Issue has been marked as resolved",
        className: "bg-green-600 text-white border-green-700",
      });
    } catch (e) {
      console.error("Failed to resolve on backend", e);
      setAllDepartmentIssues(previousIssues);
      toast({
        title: "Error",
        description: "Failed to resolve issue. Please check your connection or try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectConfirm = async (formData: FormData) => {
    if (!rejectIssue) return;

    const previousIssues = [...allDepartmentIssues];

    const updatedList = allDepartmentIssues.map((i) =>
      i.id === rejectIssue.id ? { ...i, status: "rejected" } : i
    );
    setAllDepartmentIssues(updatedList);

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `http://localhost:5000/api/issues/${rejectIssue.id}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject issue");
      }

      toast({
        title: "Rejected",
        description: "Issue has been rejected",
      });
    } catch (e) {
      console.error("Failed to reject issue", e);
      setAllDepartmentIssues(previousIssues);
      toast({
        title: "Error",
        description: "Failed to reject issue",
        variant: "destructive",
      });
    }
  };

  // Reuse engagement logic (simplified)
  const handleEngage = (id: string, action: string) => {
    console.log("Engage", id, action);
  };
  const handleComment = (id: string, text: string) => {
    console.log("Comment", id, text);
  };

  const formatDate = (isoDate: string) => {
    if (!isoDate) return "";
    return new Date(isoDate).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex pt-16 h-screen overflow-hidden">
        {/* Sidebar */}
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

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.href;
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
          <div className="p-6 border-t border-border/50 flex flex-col items-center text-center opacity-50">
            <p className="text-xs text-muted-foreground">
              Municipal Control Center v1.0
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 flex flex-col min-w-0 overflow-hidden">
          <header className="h-20 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-between px-8 shrink-0 z-10">
            <div className="flex items-center gap-4"></div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  className="pl-10 w-64 h-9 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="text-sm font-medium mr-4">
                {user?.department || "Admin"} Department
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-bold">Manage Issues</h2>

              <div className="flex bg-muted/50 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    activeTab === "pending"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab("in-progress")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    activeTab === "in-progress"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setActiveTab("resolved")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    activeTab === "resolved"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Resolved
                </button>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 border-b border-border/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                        Issue
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                        Category
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                        Location
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                        Priority
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                        SLA / Days Left
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredIssues.length === 0 && !loading && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-muted-foreground"
                        >
                          No {activeTab.replace("-", " ")} issues found.
                        </td>
                      </tr>
                    )}
                    {filteredIssues.map((issue) => (
                      <tr
                        key={issue.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm">
                              {issue.title}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />{" "}
                              {formatDate(issue.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="font-normal">
                            {issue.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {issue.location}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs border border-transparent font-medium capitalize",
                              statusConfig[issue.status]?.class ||
                              "bg-secondary"
                            )}
                          >
                            {issue.status}
                          </Badge>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-medium capitalize w-fit",
                                priorityConfig[issue.priority]?.class || ""
                              )}
                            >
                              {issue.priority}
                            </Badge>
                            {/* Escalation Indicator */}
                            {issue.adminEscalatedPriority &&
                              (() => {
                                const pMap: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
                                const current = pMap[issue.priority?.toLowerCase()] || 0;
                                const escalated = pMap[issue.adminEscalatedPriority?.toLowerCase()] || 0;
                                return current > 0 && escalated > current;
                              })() &&
                              issue.status !== "resolved" &&
                              issue.status !== "rejected" && (
                                <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5 mt-0.5">
                                  Escalated to {issue.adminEscalatedPriority.toLowerCase()}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {issue.status !== "resolved" && issue.status !== "rejected" && issue.daysRemaining !== undefined ? (
                            <div className="flex flex-col">
                              <span className={cn(
                                "font-bold text-sm",
                                issue.daysRemaining <= 0 ? "text-red-600" :
                                  issue.daysRemaining <= 2 ? "text-yellow-600" : "text-green-600"
                              )}>
                                {Math.ceil(issue.daysRemaining)} days
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {issue.slaStatus}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setDetailsIssue(issue)}
                              >
                                View Details
                              </DropdownMenuItem>

                              {activeTab === "pending" && (
                                <DropdownMenuItem
                                  onClick={() => setPlanningIssue(issue)}
                                  className="text-blue-600 font-medium"
                                >
                                  Plan Resolution
                                </DropdownMenuItem>
                              )}

                              {activeTab === "in-progress" && (
                                <DropdownMenuItem
                                  onClick={() => setResolveIssue(issue)}
                                  className="text-green-600 font-medium"
                                >
                                  Finalize & Resolve
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      <IssueDetailModal
        issue={detailsIssue}
        isOpen={!!detailsIssue}
        onClose={() => setDetailsIssue(null)}
        onEngage={handleEngage}
        onComment={handleComment}
      />

      <PlanningModal
        issue={planningIssue}
        isOpen={!!planningIssue}
        onClose={() => setPlanningIssue(null)}
        onPlan={handlePlanConfirm}
        onReject={() => {
          const issueToReject = planningIssue;
          setPlanningIssue(null);
          setTimeout(() => setRejectIssue(issueToReject), 150); // Small delay for smooth transition
        }}
      />

      <RejectionModal
        issue={rejectIssue}
        isOpen={!!rejectIssue}
        onClose={() => setRejectIssue(null)}
        onReject={handleRejectConfirm}
      />

      <ResolutionModal
        issue={resolveIssue}
        isOpen={!!resolveIssue}
        onClose={() => setResolveIssue(null)}
        onResolve={handleResolveConfirm}
      />
    </div >
  );
};

export default ManageIssues;
