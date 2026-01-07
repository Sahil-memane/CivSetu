import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { CivicMap } from "@/components/CivicMap";
import { Issue } from "@/components/issues/IssueCard";
import { findIssueClusters, Cluster } from "@/utils/clustering";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  MapPin,
  FileText,
  BarChart3,
  Settings,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { SurveyCreationForm } from "@/components/surveys/SurveyCreationForm";

const AdminMapView = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [isCreatingSurvey, setIsCreatingSurvey] = useState(false);
  const [allSurveys, setAllSurveys] = useState<any[]>([]);
  const [viewResponseSurvey, setViewResponseSurvey] = useState<any>(null);
  const [surveyResponses, setSurveyResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const fetchSurveys = async () => {
    const toastId = toast.loading("Refreshing surveys...");
    try {
      // First, verify backend is reachable
      try {
        const healthCheck = await fetch("http://localhost:5000/api/health");
        if (!healthCheck.ok) {
          toast.dismiss(toastId);
          toast.error("Backend health check failed. Is the server running?");
          return;
        }
        console.log("✅ Backend health check passed");
      } catch (healthError) {
        toast.dismiss(toastId);
        toast.error(
          "Cannot reach backend at localhost:5000. Check if server is running."
        );
        console.error("Health check failed:", healthError);
        return;
      }

      if (!user) {
        toast.dismiss(toastId);
        toast.error("User not found via AuthContext");
        return;
      }

      console.log("Getting auth token...");
      const userToken = await auth.currentUser?.getIdToken();

      if (!userToken) {
        toast.dismiss(toastId);
        toast.error("Unable to get authentication token");
        return;
      }

      console.log(
        "Fetching surveys from:",
        "http://localhost:5000/api/surveys"
      );
      console.log("Token:", userToken ? "Present" : "Missing");

      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch("http://localhost:5000/api/surveys", {
        headers: { Authorization: `Bearer ${userToken}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      toast.dismiss(toastId);

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched surveys:", data.surveys);
        console.log("Debug info:", data.debug);
        setAllSurveys(data.surveys || []);

        if (!data.surveys || data.surveys.length === 0) {
          console.warn("Debug Info:", data.debug);
          toast.warning(
            `0 surveys. DB found: ${data.debug?.snapshotSize ?? "?"} items.`
          );
        } else {
          toast.success(`Found ${data.surveys.length} surveys.`);
        }
      } else {
        const text = await response.text();
        console.error("Failed to fetch surveys:", text);
        toast.error(`Server Error: ${response.status}`);
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error("Failed to fetch surveys", error);
      if (error.name === "AbortError") {
        toast.error("Request timed out. Backend may be slow or unresponsive.");
      } else {
        toast.error(`Network Error: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    if (user) {
      console.log("👤 AdminMapView - User authenticated:", {
        uid: (user as any)?.uid,
        email: (user as any)?.email,
        role: (user as any)?.role,
      });
      fetchSurveys();
    } else {
      console.warn("⚠️ AdminMapView - No user found in AuthContext");
    }
  }, [user]);

  const handleViewResponses = async (survey: any) => {
    setViewResponseSurvey(survey);
    setLoadingResponses(true);
    try {
      const userToken = await auth.currentUser?.getIdToken();
      console.log("Fetching responses for survey:", survey.id);

      const response = await fetch(
        `http://localhost:5000/api/surveys/${survey.id}/responses`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Received responses:", data.responses);
        setSurveyResponses(data.responses || []);
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch responses:", response.status, errorText);
        toast.error("Failed to fetch responses");
      }
    } catch (error) {
      console.error("Error fetching responses:", error);
      toast.error("Failed to fetch responses");
    } finally {
      setLoadingResponses(false);
    }
  };

  // Fetch Issues
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/issues/all");
        if (response.ok) {
          const data = await response.json();
          // Transform if necessary, ensuring coordinates are present
          const validIssues = (data.issues || [])
            .map((issue: any) => ({
              ...issue,
              // Ensure optional fields match Issue interface in case backend differs
              agrees: issue.agrees || [],
              disagrees: issue.disagrees || [],
              comments: issue.comments || [],
            }))
            .filter(
              (i: any) =>
                i.coordinates &&
                typeof i.coordinates.lat === "number" &&
                typeof i.coordinates.lng === "number" &&
                i.category &&
                i.category.trim() !== "" && // Must have category
                i.title !== "Civic Issue Reported" // Filter out default/incomplete titles
            );

          setIssues(validIssues);

          // Calculate Clusters
          const foundClusters = findIssueClusters(validIssues, 500); // 500m radius
          setClusters(foundClusters);
        }
      } catch (error) {
        console.error("Failed to fetch issues", error);
        toast.error("Failed to load issues data");
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  const handleClusterSelect = (cluster: Cluster) => {
    // If we are already creating a survey, maybe warn or switch?
    // For now, let's just create a new flow.
    setSelectedCluster(cluster);
    setIsCreatingSurvey(false); // Reset form mode until they explicitly click create
  };

  const handleCreateSurvey = () => {
    if (!selectedCluster) return;
    setIsCreatingSurvey(true);
    // Don't clear selectedCluster yet, as we need it for the form
  };

  const handleSurveySuccess = (newSurvey: any) => {
    setIsCreatingSurvey(false);
    setSelectedCluster(null);
    fetchSurveys();
    toast.success(`Survey "${newSurvey.title}" created successfully!`);
  };

  const handleSurveyCancel = () => {
    setIsCreatingSurvey(false);
    setSelectedCluster(null);
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: MapPin, label: "Map View", href: "/admin/map", active: true },
    { icon: FileText, label: "Manage Issues", href: "/admin/issues" },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

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
            {sidebarItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-base font-medium transition-all group",
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "w-6 h-6",
                    item.active
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.label}
              </a>
            ))}
          </div>

          <div className="p-6 border-t border-border/50 flex flex-col items-center text-center opacity-50">
            <p className="text-xs text-muted-foreground">
              Municipal Control Center v1.0
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="h-20 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-between px-8 shrink-0 z-10">
            <div className="flex items-center gap-4">
              <h1 className="font-display text-2xl font-bold">
                Spatial Analysis
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-sm font-medium mr-4">
                {user?.department || "Admin"} Department
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold">
                  Cluster Analysis
                </h2>
                <p className="text-muted-foreground text-sm">
                  Identify issue clusters and plan surveys
                </p>
              </div>
              <div className="flex gap-2">
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium border border-orange-200">
                  {clusters.length} Active Clusters Found
                </div>
              </div>
            </div>

            <div className="flex-1 bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden relative min-h-[500px]">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <CivicMap
                  issues={issues}
                  onIssueSelect={(issue) =>
                    console.log("Selected issue", issue)
                  }
                  clusters={clusters}
                  onClusterSelect={handleClusterSelect}
                />
              )}
            </div>

            {isCreatingSurvey && selectedCluster && (
              <SurveyCreationForm
                cluster={selectedCluster}
                onCancel={() => setIsCreatingSurvey(false)}
                onSuccess={handleSurveySuccess}
              />
            )}

            {!isCreatingSurvey && (
              <div className="bg-card border border-border/50 rounded-xl p-6 mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-lg">
                    Active Community Surveys
                  </h3>
                  <Button variant="ghost" size="sm" onClick={fetchSurveys}>
                    Refresh List
                  </Button>
                </div>
                {allSurveys.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active surveys found. Create one from a cluster above.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {allSurveys.map((survey) => (
                      <div
                        key={survey.id}
                        className="flex items-start justify-between p-4 border rounded-lg bg-background/50 hover:bg-background transition-colors"
                      >
                        <div>
                          <h4 className="font-medium">{survey.title}</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            Created:{" "}
                            {new Date(survey.createdAt).toLocaleDateString()}
                          </p>
                          <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded inline-block">
                            Target: {survey.clusterData?.issueCount || 0} issues
                            / {survey.targetUserIds?.length || 0} citizens
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewResponses(survey)}
                        >
                          View Responses
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Cluster Action Dialog */}
      <Dialog
        open={!!selectedCluster && !isCreatingSurvey}
        onOpenChange={(open) => !open && setSelectedCluster(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Cluster Detected</DialogTitle>
            <DialogDescription>
              This area has {selectedCluster?.issues.length} reported issues
              within a 500m radius. Would you like to initiate a survey for this
              region?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="text-sm font-medium mb-2">Included Issues:</div>
            <ul className="max-h-40 overflow-y-auto space-y-1">
              {selectedCluster?.issues.map((i) => (
                <li
                  key={i.id}
                  className="text-xs text-muted-foreground border-b border-border/50 pb-1"
                >
                  • {i.title} ({i.category})
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCluster(null)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSurvey}>Create Survey</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Viewer Dialog */}
      <Dialog
        open={!!viewResponseSurvey}
        onOpenChange={(open) => !open && setViewResponseSurvey(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Survey Responses: {viewResponseSurvey?.title}
            </DialogTitle>
            <DialogDescription>
              Reviewing feedback from citizens in the targeted cluster.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {loadingResponses ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin" />
              </div>
            ) : surveyResponses.length === 0 ? (
              <p className="text-muted-foreground text-center">
                No responses received yet.
              </p>
            ) : (
              surveyResponses.map((resp: any, idx: number) => (
                <div key={idx} className="bg-muted/30 p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-sm font-bold">
                        {resp.userName || "Unknown User"}
                      </span>
                      {resp.userEmail && (
                        <span className="text-xs text-muted-foreground block">
                          {resp.userEmail}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(resp.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(resp.responses || {}).map(
                      ([qIdx, ans]: [string, any]) => (
                        <div key={qIdx} className="text-sm">
                          <span className="font-semibold block text-xs uppercase tracking-wide opacity-70">
                            {viewResponseSurvey?.questions?.[parseInt(qIdx)] ||
                              `Question ${parseInt(qIdx) + 1}`}
                          </span>
                          <div className="mt-1">
                            {typeof ans === "string"
                              ? ans
                              : JSON.stringify(ans)}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewResponseSurvey(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMapView;
