import {
  MapPin,
  Clock,
  Users,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "pending" | "in-progress" | "resolved" | "escalated";
  location: string;
  reportedAt: string;
  verifications: number;
  priority: "low" | "medium" | "high" | "critical";
  imageUrl?: string;
}

interface IssueCardProps {
  issue: Issue;
  onClick?: () => void;
}

const statusConfig = {
  pending: { label: "Pending", class: "status-pending" },
  "in-progress": { label: "In Progress", class: "status-in-progress" },
  resolved: { label: "Resolved", class: "status-resolved" },
  escalated: { label: "Escalated", class: "status-escalated" },
};

const priorityConfig = {
  low: { label: "Low", class: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", class: "bg-warning/20 text-warning" },
  high: { label: "High", class: "bg-destructive/20 text-destructive" },
  critical: {
    label: "Critical",
    class: "bg-destructive text-destructive-foreground",
  },
};

const categoryIcons: Record<string, string> = {
  pothole: "🕳️",
  water: "💧",
  garbage: "🗑️",
  streetlight: "💡",
  drainage: "🚰",
  road: "🛣️",
  other: "📋",
};

export function IssueCard({ issue, onClick }: IssueCardProps) {
  return (
    <div
      onClick={onClick}
      className="group bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/30 hover:shadow-card-hover transition-all duration-300 cursor-pointer h-full flex flex-col"
    >
      {/* Image */}
      <div className="aspect-video w-full bg-muted relative overflow-hidden flex-shrink-0">
        {issue.imageUrl ? (
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">
              {categoryIcons[issue.category] || categoryIcons.other}
            </span>
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          <Badge
            className={cn(
              "text-xs font-medium shadow-sm backdrop-blur-sm",
              priorityConfig[issue.priority].class
            )}
          >
            {issue.priority === "critical" && (
              <AlertTriangle className="w-3 h-3 mr-1" />
            )}
            {priorityConfig[issue.priority].label}
          </Badge>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Category & Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {categoryIcons[issue.category] || categoryIcons.other}
            </span>
            <span className="text-sm font-medium text-muted-foreground capitalize">
              {issue.category}
            </span>
          </div>
          <Badge className={cn("text-xs", statusConfig[issue.status].class)}>
            {statusConfig[issue.status].label}
          </Badge>
        </div>

        {/* Title & Description */}
        <h3 className="font-display font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-shrink-0">
          {issue.title}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
          {issue.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 flex-shrink-0">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{issue.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{issue.reportedAt}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{issue.verifications} verified</span>
          </div>
        </div>

        {/* View Arrow */}
        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-sm font-medium text-primary">View Details</span>
          <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
