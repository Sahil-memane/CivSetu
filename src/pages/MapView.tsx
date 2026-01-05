import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { IssueCard, Issue } from "@/components/issues/IssueCard";
import { IssueCategoryFilter } from "@/components/issues/IssueCategoryFilter";
import { IssueStatusFilter } from "@/components/issues/IssueStatusFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, List, Filter, X } from "lucide-react";

// Mock data for demonstration
const mockIssues: Issue[] = [
  {
    id: "1",
    title: "Large Pothole Near Market",
    description: "A deep pothole has formed near the main market entrance causing traffic congestion and vehicle damage.",
    category: "pothole",
    status: "pending",
    location: "MG Road, Sector 5",
    reportedAt: "2 hours ago",
    verifications: 12,
    priority: "high",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    title: "Broken Street Light",
    description: "Street light not working for past 3 days. Area becomes very dark at night creating safety concerns.",
    category: "streetlight",
    status: "in-progress",
    location: "Gandhi Nagar, Block B",
    reportedAt: "1 day ago",
    verifications: 8,
    priority: "medium",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    title: "Garbage Overflow",
    description: "Community dustbin overflowing for the past week. Causing foul smell and attracting stray animals.",
    category: "garbage",
    status: "escalated",
    location: "Rajiv Chowk, Lane 4",
    reportedAt: "3 days ago",
    verifications: 25,
    priority: "critical",
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&h=300&fit=crop",
  },
  {
    id: "4",
    title: "Water Pipeline Leak",
    description: "Major water pipeline leak causing water wastage and road flooding. Urgent attention needed.",
    category: "water",
    status: "in-progress",
    location: "Station Road",
    reportedAt: "5 hours ago",
    verifications: 15,
    priority: "high",
    imageUrl: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&h=300&fit=crop",
  },
  {
    id: "5",
    title: "Blocked Drainage",
    description: "Storm drain blocked with debris causing waterlogging during rains.",
    category: "drainage",
    status: "pending",
    location: "Civil Lines",
    reportedAt: "12 hours ago",
    verifications: 6,
    priority: "medium",
  },
  {
    id: "6",
    title: "Road Damage After Rain",
    description: "Road surface damaged after recent heavy rains. Multiple cracks and uneven surface.",
    category: "road",
    status: "resolved",
    location: "NH-44 Service Road",
    reportedAt: "1 week ago",
    verifications: 18,
    priority: "low",
  },
];

const MapView = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showFilters, setShowFilters] = useState(false);

  const filteredIssues = mockIssues.filter((issue) => {
    const matchesCategory = selectedCategory === "all" || issue.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || issue.status === selectedStatus;
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          issue.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-16">
        {/* Header */}
        <div className="bg-card border-b border-border/50">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold">Issue Map</h1>
                <p className="text-muted-foreground">View and track civic issues across your city</p>
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
                  {showFilters ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                </Button>

                <div className="hidden md:flex items-center bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                    className="gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Map
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="gap-2"
                  >
                    <List className="w-4 h-4" />
                    List
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className={`mt-6 space-y-4 ${showFilters ? "block" : "hidden md:block"}`}>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Category</label>
                <IssueCategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Status</label>
                <IssueStatusFilter selected={selectedStatus} onChange={setSelectedStatus} />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {viewMode === "map" ? (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Map Placeholder */}
              <div className="lg:col-span-2 h-[600px] bg-muted rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,hsl(var(--muted))_25%,hsl(var(--muted))_50%,transparent_50%,transparent_75%,hsl(var(--muted))_75%)] bg-[length:40px_40px] opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground font-medium">Interactive Map</p>
                    <p className="text-sm text-muted-foreground/70">Google Maps integration coming soon</p>
                  </div>
                </div>
                
                {/* Fake Map Pins */}
                <div className="absolute top-1/4 left-1/3">
                  <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center animate-pulse-slow shadow-lg">
                    <span className="text-destructive-foreground text-xs font-bold">3</span>
                  </div>
                </div>
                <div className="absolute top-1/2 right-1/4">
                  <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center animate-pulse-slow shadow-lg" style={{ animationDelay: "1s" }}>
                    <span className="text-warning-foreground text-xs font-bold">5</span>
                  </div>
                </div>
                <div className="absolute bottom-1/3 left-1/2">
                  <div className="w-8 h-8 bg-info rounded-full flex items-center justify-center animate-pulse-slow shadow-lg" style={{ animationDelay: "2s" }}>
                    <span className="text-info-foreground text-xs font-bold">2</span>
                  </div>
                </div>
              </div>

              {/* Issue List */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                <p className="text-sm text-muted-foreground font-medium">
                  {filteredIssues.length} issues found
                </p>
                {filteredIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-4">
                {filteredIssues.length} issues found
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MapView;
