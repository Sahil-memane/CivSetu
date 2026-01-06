import {
  MapPin,
  Clock,
  Users,
  ChevronRight,
  AlertTriangle,
  Mic,
  FileText,
  Image,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
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
  files?: any; // To check for other file types
  agrees?: string[];
  disagrees?: string[];
  comments?: any[];
  uid?: string;
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
  const images = issue.files?.images || [];
  const voice = issue.files?.voice;
  const documents = issue.files?.documents || [];

  // Helper to detect media types
  const hasVoice = !!voice;
  const hasImages = images.some((url: string) =>
    /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url)
  );
  const hasDocs = documents.some((url: string) =>
    /\.(pdf|doc|docx|txt)(\?.*)?$/i.test(url)
  );

  // Determine main preview
  const previewImage = images.find((url: string) =>
    /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url)
  );

  const agreeCount = issue.agrees?.length || 0;
  const disagreeCount = issue.disagrees?.length || 0;
  const commentCount = issue.comments?.length || 0;

  return (
    <div
      onClick={onClick}
      className="group bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/30 hover:shadow-card-hover transition-all duration-300 cursor-pointer h-full flex flex-col"
    >
      {/* Media Preview Section */}
      <div className="aspect-video w-full bg-muted relative overflow-hidden flex-shrink-0">
        {previewImage ? (
          <img
            src={previewImage}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-muted/50 p-4 text-center">
            {hasDocs ? (
              <>
                <FileText className="w-12 h-12 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground font-medium">
                  Document Attached
                </span>
              </>
            ) : hasVoice ? (
              <>
                <Mic className="w-12 h-12 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground font-medium">
                  Voice Note Only
                </span>
              </>
            ) : (
              <span className="text-4xl">
                {categoryIcons[issue.category] || categoryIcons.other}
              </span>
            )}
          </div>
        )}

        {/* Priority Badge */}
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

        {/* Media Type Indicators (Bottom Right of Image) */}
        <div className="absolute bottom-3 right-3 flex gap-1.5 pointer-events-none">
          {images.length > 1 && (
            <div className="px-2 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center gap-1 text-white text-[10px] font-medium">
              <Image className="w-3.5 h-3.5" />
              <span>{images.length}</span>
            </div>
          )}
          {hasVoice && (
            <div
              className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white"
              title="Voice Note"
            >
              <Mic className="w-3.5 h-3.5" />
            </div>
          )}
          {hasDocs && (
            <div
              className="px-2 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center gap-1 text-white text-[10px] font-medium"
              title="Documents"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{documents.length || 1}</span>
            </div>
          )}
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

        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-y-2 text-xs text-muted-foreground mb-4 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{issue.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{issue.reportedAt}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <Users className="w-3.5 h-3.5" />
            <span>{issue.verifications} official verifications</span>
          </div>
        </div>

        {/* Engagement Stats Footer */}
        <div className="mt-auto pt-3 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{agreeCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>{disagreeCount}</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{commentCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
