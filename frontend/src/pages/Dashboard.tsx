import { useState, useEffect } from "react";

import { Footer } from "@/components/layout/Footer";
import { IssueCard, Issue } from "@/components/issues/IssueCard";
import { IssueDetailModal } from "@/components/issues/IssueDetailModal";
import { IssueStatusFilter } from "@/components/issues/IssueStatusFilter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  TrendingUp,
  Plus,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";

const Dashboard = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userIssues, setUserIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's issues from backend
  useEffect(() => {
    const fetchUserIssues = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setIsLoading(false);
          return;
        }

        const token = await currentUser.getIdToken();
        const response = await fetch("http://localhost:5000/api/issues/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Transform Firestore data to Issue format
          const transformedIssues: Issue[] = data.issues.map((issue: any) => ({
            id: issue.id,
            title: issue.title,
            description: issue.description,
            category: issue.category,
            status: issue.status,
            location: issue.location,
            reportedAt: formatDate(issue.createdAt),
            verifications: issue.verifications || 0,
            priority: issue.priority,
            imageUrl: issue.files?.images?.[0]
              ? issue.files.images[0].startsWith("http")
                ? issue.files.images[0]
                : `http://localhost:5000/${issue.files.images[0]}`
              : undefined,
            // Pass raw arrays for engagement logic
            agrees: issue.agrees || [],
            disagrees: issue.disagrees || [],
            comments: issue.comments || [],
            // Pass full file object for modal
            files: issue.files,
            uid: issue.uid,
            // Map new fields
            actionTaken: issue.actionTaken,
            staffAllocated: issue.staffAllocated,
            resourcesUsed: issue.resourcesUsed,
            planningDocs: issue.planningDocs,
            updatedAt: issue.updatedAt,
            resolutionRemarks: issue.resolutionRemarks,
            resolutionProofs: issue.resolutionProofs,
            resolvedAt: issue.resolvedAt,
            rejectedAt: issue.rejectedAt,
            rejectionReason: issue.rejectionReason,
            rejectionProofs: issue.rejectionProofs,
          }));
          setUserIssues(transformedIssues);
        } else {
          console.error("Failed to fetch issues:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserIssues();
  }, [user]); // Re-run when user object changes (e.g., after login)

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleEngage = async (id: string, action: "agree" | "disagree") => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();

      await fetch(`http://localhost:5000/api/issues/${id}/engage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      // Optimistic update
      setUserIssues((prev) =>
        prev.map((issue) => {
          if (issue.id === id) {
            const uid = currentUser.uid;
            let newAgrees = issue.agrees || [];
            let newDisagrees = issue.disagrees || [];

            if (action === "agree") {
              if (newAgrees.includes(uid))
                newAgrees = newAgrees.filter((u: string) => u !== uid);
              else {
                newAgrees = [...newAgrees, uid];
                newDisagrees = newDisagrees.filter((u: string) => u !== uid);
              }
            } else {
              if (newDisagrees.includes(uid))
                newDisagrees = newDisagrees.filter((u: string) => u !== uid);
              else {
                newDisagrees = [...newDisagrees, uid];
                newAgrees = newAgrees.filter((u: string) => u !== uid);
              }
            }
            const updated = {
              ...issue,
              agrees: newAgrees,
              disagrees: newDisagrees,
            };
            if (selectedIssue?.id === id) setSelectedIssue(updated);
            return updated;
          }
          return issue;
        })
      );
    } catch (err) {
      console.error("Engagement failed", err);
    }
  };

  const handleComment = async (id: string, text: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();

      const res = await fetch(
        `http://localhost:5000/api/issues/${id}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setUserIssues((prev) =>
          prev.map((issue) => {
            if (issue.id === id) {
              const updated = {
                ...issue,
                comments: [...(issue.comments || []), data.comment],
              };
              if (selectedIssue?.id === id) setSelectedIssue(updated);
              return updated;
            }
            return issue;
          })
        );
      }
    } catch (err) {
      console.error("Comment failed", err);
    }
  };

  const filteredIssues = userIssues.filter(
    (issue) => statusFilter === "all" || issue.status === statusFilter
  );

  // Use actual user data with fallbacks for mock stats
  const userData = {
    name: user?.name || "User",
    email: user?.email || "",
    role: user?.role || "citizen",
    department: user?.department,
    points: 450, // TODO: Fetch from backend
    rank: "Active Citizen",
    issuesReported: userIssues.length,
    issuesResolved: userIssues.filter((i) => i.status === "resolved").length,
    verificationsGiven: 34, // TODO: Fetch from backend
  };

  const statCards = [
    {
      icon: FileText,
      label: "Issues Reported",
      value: userData.issuesReported,
      color: "bg-primary/10 text-primary",
    },
    {
      icon: CheckCircle2,
      label: "Issues Resolved",
      value: userData.issuesResolved,
      color: "bg-success/10 text-success",
    },
    {
      icon: Clock,
      label: "In Progress",
      value: userIssues.filter((i) => i.status === "in-progress").length,
      color: "bg-info/10 text-info",
    },
    {
      icon: AlertTriangle,
      label: "Pending Review",
      value: userIssues.filter((i) => i.status === "pending").length,
      color: "bg-warning/10 text-warning",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">
                My Dashboard
              </h1>
              <p className="text-muted-foreground text-xs font-mono">
                UID: {auth.currentUser?.uid}
              </p>
              <p className="text-muted-foreground">
                Track your civic contributions and issue status
              </p>
            </div>
            <Link to="/report">
              <Button variant="hero" className="gap-2">
                <Plus className="w-4 h-4" />
                Report New Issue
              </Button>
            </Link>
          </div>

          {/* User Card */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl hero-gradient flex items-center justify-center text-3xl font-bold text-primary-foreground">
                {userData.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold">
                  {userData.name}
                </h2>
                <p className="text-sm text-muted-foreground mb-2">
                  {userData.email}
                </p>
                <div className="flex items-center gap-3">
                  <Badge className="bg-accent/20 text-accent capitalize">
                    {userData.role}
                  </Badge>
                  {userData.department && (
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-primary"
                    >
                      {userData.department}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {userData.verificationsGiven} verifications given
                  </span>
                </div>
              </div>

              {/* Points */}
              <div className="bg-muted rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Award className="w-5 h-5 text-accent" />
                  <span className="font-display text-2xl font-bold">
                    {userData.points}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Civic Points
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="bg-card rounded-2xl border border-border/50 p-5"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="font-display text-2xl font-bold">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Issues Tabs */}
          <Tabs defaultValue="my-issues" className="space-y-6">
            <TabsList className="bg-muted p-1 rounded-xl">
              <TabsTrigger value="my-issues" className="rounded-lg">
                My Issues
              </TabsTrigger>
              <TabsTrigger value="verified" className="rounded-lg">
                Verified by Me
              </TabsTrigger>
              <TabsTrigger value="nearby" className="rounded-lg">
                Nearby Issues
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-issues" className="space-y-6">
              {/* Status Filter */}
              <IssueStatusFilter
                value={statusFilter}
                onChange={setStatusFilter}
              />

              {/* Issues List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">
                    Loading your issues...
                  </span>
                </div>
              ) : filteredIssues.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">
                    No issues found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {statusFilter === "all"
                      ? "You haven't reported any issues yet."
                      : `No ${statusFilter} issues found.`}
                  </p>
                  <Link to="/report">
                    <Button variant="hero">Report Your First Issue</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                  {filteredIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onClick={() => setSelectedIssue(issue)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="verified">
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">
                  Verifications
                </h3>
                <p className="text-muted-foreground">
                  You've helped verify {userData.verificationsGiven} issues in
                  your community.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="nearby">
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">
                  Nearby Issues
                </h3>
                <p className="text-muted-foreground mb-4">
                  Enable location to see issues near you and help verify them.
                </p>
                <Link to="/map">
                  <Button variant="outline">View Issue Map</Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>

          {/* Modal */}
          <IssueDetailModal
            issue={selectedIssue}
            isOpen={!!selectedIssue}
            onClose={() => setSelectedIssue(null)}
            onEngage={handleEngage}
            onComment={handleComment}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
