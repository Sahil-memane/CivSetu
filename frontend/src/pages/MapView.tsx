import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { IssueCard, Issue } from "@/components/issues/IssueCard";
import { IssueCategoryFilter } from "@/components/issues/IssueCategoryFilter";
import { IssueStatusFilter } from "@/components/issues/IssueStatusFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, List, Filter, X, Loader2 } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const MapView = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchAllIssues = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/issues/all");
        if (response.ok) {
          const data = await response.json();
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
              ? `http://localhost:5000/${issue.files.images[0]}`
              : undefined,
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

  const filteredIssues = issues.filter((issue) => {
    const matchesCategory =
      selectedCategory === "all" || issue.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" || issue.status === selectedStatus;
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

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
              <div className="w-full h-[500px] bg-muted rounded-2xl relative overflow-hidden border border-border">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,hsl(var(--muted))_25%,hsl(var(--muted))_50%,transparent_50%,transparent_75%,hsl(var(--muted))_75%)] bg-[length:40px_40px] opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      Interactive Map is Loading...
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      (Mock Version)
                    </p>
                  </div>
                </div>

                {/* Mock Map Pins with Hover Cards */}
                <div className="absolute inset-0">
                  {/* Critical Issue Pin */}
                  <div className="absolute top-1/4 left-1/3">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center animate-pulse-slow shadow-lg cursor-pointer hover:scale-110 transition-transform">
                          <span className="text-destructive-foreground text-xs font-bold">
                            {
                              issues.filter((i) => i.priority === "critical")
                                .length
                            }
                          </span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="flex justify-between space-x-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">
                              Critical Issues
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              High priority issues requiring immediate attention
                              in this area.
                            </p>
                            <div className="flex items-center pt-2">
                              <span className="text-xs text-muted-foreground">
                                {
                                  issues.filter(
                                    (i) => i.priority === "critical"
                                  ).length
                                }{" "}
                                issues found
                              </span>
                            </div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>

                  {/* High Priority Pin */}
                  <div className="absolute top-1/2 right-1/4">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div
                          className="w-8 h-8 bg-warning rounded-full flex items-center justify-center animate-pulse-slow shadow-lg cursor-pointer hover:scale-110 transition-transform"
                          style={{ animationDelay: "1s" }}
                        >
                          <span className="text-warning-foreground text-xs font-bold">
                            {issues.filter((i) => i.priority === "high").length}
                          </span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="flex justify-between space-x-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">
                              High Priority
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Issues that affect many users but are not critical
                              hazards.
                            </p>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>

                  {/* Normal Priority Pin */}
                  <div className="absolute bottom-1/3 left-1/2">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div
                          className="w-8 h-8 bg-info rounded-full flex items-center justify-center animate-pulse-slow shadow-lg cursor-pointer hover:scale-110 transition-transform"
                          style={{ animationDelay: "2s" }}
                        >
                          <span className="text-info-foreground text-xs font-bold">
                            {
                              issues.filter(
                                (i) =>
                                  i.priority === "medium" ||
                                  i.priority === "low"
                              ).length
                            }
                          </span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="flex justify-between space-x-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">
                              General Issues
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Includes reported potholes, garbage, and other
                              community reports.
                            </p>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
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
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MapView;
