import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { IssueCard, Issue } from "@/components/issues/IssueCard";
import { IssueStatusFilter } from "@/components/issues/IssueStatusFilter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CheckCircle2, Clock, AlertTriangle, Award, TrendingUp, Plus } from "lucide-react";
import { Link } from "react-router-dom";

// Mock user data
const userData = {
  name: "Rahul Sharma",
  points: 450,
  rank: "Active Citizen",
  issuesReported: 12,
  issuesResolved: 8,
  verificationsGiven: 34,
};

// Mock issues
const userIssues: Issue[] = [
  {
    id: "1",
    title: "Large Pothole Near Market",
    description: "A deep pothole has formed near the main market entrance causing traffic congestion.",
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
    description: "Street light not working for past 3 days. Area becomes very dark at night.",
    category: "streetlight",
    status: "in-progress",
    location: "Gandhi Nagar, Block B",
    reportedAt: "1 day ago",
    verifications: 8,
    priority: "medium",
  },
  {
    id: "3",
    title: "Water Pipeline Leak",
    description: "Major water pipeline leak causing water wastage and road flooding.",
    category: "water",
    status: "resolved",
    location: "Station Road",
    reportedAt: "1 week ago",
    verifications: 15,
    priority: "high",
  },
];

const Dashboard = () => {
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredIssues = userIssues.filter((issue) =>
    statusFilter === "all" || issue.status === statusFilter
  );

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
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">My Dashboard</h1>
              <p className="text-muted-foreground">Track your civic contributions and issue status</p>
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
                {userData.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold">{userData.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <Badge className="bg-accent/20 text-accent">{userData.rank}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {userData.verificationsGiven} verifications given
                  </span>
                </div>
              </div>

              {/* Points */}
              <div className="bg-muted rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Award className="w-5 h-5 text-accent" />
                  <span className="font-display text-2xl font-bold">{userData.points}</span>
                </div>
                <span className="text-sm text-muted-foreground">Civic Points</span>
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
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="font-display text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Issues Tabs */}
          <Tabs defaultValue="my-issues" className="space-y-6">
            <TabsList className="bg-muted p-1 rounded-xl">
              <TabsTrigger value="my-issues" className="rounded-lg">My Issues</TabsTrigger>
              <TabsTrigger value="verified" className="rounded-lg">Verified by Me</TabsTrigger>
              <TabsTrigger value="nearby" className="rounded-lg">Nearby Issues</TabsTrigger>
            </TabsList>

            <TabsContent value="my-issues" className="space-y-6">
              {/* Status Filter */}
              <IssueStatusFilter selected={statusFilter} onChange={setStatusFilter} />

              {/* Issues List */}
              {filteredIssues.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredIssues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">No issues found</h3>
                  <p className="text-muted-foreground mb-4">
                    {statusFilter === "all" 
                      ? "You haven't reported any issues yet."
                      : `No ${statusFilter} issues found.`}
                  </p>
                  <Link to="/report">
                    <Button variant="hero">Report Your First Issue</Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="verified">
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">Verifications</h3>
                <p className="text-muted-foreground">
                  You've helped verify {userData.verificationsGiven} issues in your community.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="nearby">
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">Nearby Issues</h3>
                <p className="text-muted-foreground mb-4">
                  Enable location to see issues near you and help verify them.
                </p>
                <Link to="/map">
                  <Button variant="outline">View Issue Map</Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
