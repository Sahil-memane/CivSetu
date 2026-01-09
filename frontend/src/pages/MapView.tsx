import { useState, useEffect } from "react";

import { Footer } from "@/components/layout/Footer";
import { IssueCard, Issue } from "@/components/issues/IssueCard";
import { IssueDetailModal } from "@/components/issues/IssueDetailModal";
import { IssueCategoryFilter } from "@/components/issues/IssueCategoryFilter";
import { IssueStatusFilter } from "@/components/issues/IssueStatusFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { CivicMap } from "@/components/CivicMap";

const MapView = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mapFocusTrigger, setMapFocusTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [showSlaBreachedOnly, setShowSlaBreachedOnly] = useState(false);

  useEffect(() => {
    const fetchAllIssues = async () => {
      try {
        const response = await fetch("/api/issues/all");
        if (response.ok) {
          const data = await response.json();
          const transformedIssues: Issue[] = data.issues.map((issue: any) => ({
            id: issue.id,
            title: issue.title,
            description: issue.description,
            category: issue.category,
            status: issue.status,
            location: issue.location,
            coordinates: issue.coordinates,
            reportedAt: formatDate(issue.createdAt),
            verifications: issue.verifications || 0,
            priority: issue.priority,
            imageUrl: issue.files?.images?.[0]
              ? issue.files.images[0].startsWith("http")
                ? issue.files.images[0]
                : `/${issue.files.images[0]}`
              : undefined,
            agrees: issue.agrees || [],
            disagrees: issue.disagrees || [],
            comments: issue.comments || [],
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
            // SLA Fields
            slaStatus: issue.slaStatus,
            slaDays: issue.slaDays,
            daysRemaining: issue.daysRemaining,
            slaEndDate: issue.slaEndDate,
          }));
          setIssues(transformedIssues);
        }
      } catch (error) {
        console.error("Error fetching all issues:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllIssues();
  }, []);

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
      if (!currentUser) return; // Should probably prompt login
      const token = await currentUser.getIdToken();

      await fetch(`/api/issues/${id}/engage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      // Optimistic update
      setIssues((prev) =>
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
        `/api/issues/${id}/comment`,
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
        setIssues((prev) =>
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

  const filteredIssues = issues.filter((issue) => {
    const matchesCategory =
      selectedCategory === "all" || issue.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" || issue.status === selectedStatus;
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSla = !showSlaBreachedOnly || issue.slaStatus === "BREACHED";

    return matchesCategory && matchesStatus && matchesSearch && matchesSla;
  });

  const handleIssueSelect = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
  };

  const handleViewOnMap = () => {
    setIsModalOpen(false);
    setMapFocusTrigger((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedIssue(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16 pb-16">
        {/* Header */}
        <div className="bg-card border-b border-border/50">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold">
                  Issue Map
                </h1>
                <p className="text-muted-foreground">
                  View and track civic issues across your city
                </p>
              </div>

              {/* View Toggle & Search */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden"
                >
                  {showFilters ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Filter className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div
              className={`mt-6 space-y-4 ${
                showFilters ? "block" : "hidden md:block"
              }`}
            >
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Category
                  </label>
                  <IssueCategoryFilter
                    selected={selectedCategory}
                    onChange={setSelectedCategory}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Status
                  </label>

                  <IssueStatusFilter
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant={showSlaBreachedOnly ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setShowSlaBreachedOnly(!showSlaBreachedOnly)}
                    className="gap-2 rounded-full border-dashed"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    SLA Breached
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground font-medium">
                Loading issues...
              </p>
            </div>
          ) : (
            <>
              {/* Full Width Map Section */}
              <div className="w-full">
                <CivicMap
                  issues={issues}
                  onIssueSelect={handleIssueSelect}
                  selectedIssueId={selectedIssue?.id}
                  focusTrigger={mapFocusTrigger}
                />
              </div>

              {/* Issue Grid Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold">
                    Reported Issues
                  </h2>
                  <span className="text-muted-foreground">
                    {filteredIssues.length} nearby
                  </span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                  {filteredIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onClick={() => handleIssueSelect(issue)}
                    />
                  ))}
                </div>
              </div>

              <IssueDetailModal
                issue={selectedIssue}
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onEngage={handleEngage}
                onComment={handleComment}
                onViewOnMap={handleViewOnMap}
              />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MapView;
