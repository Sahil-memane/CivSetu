import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  MapPin,
  Clock,
  FileText,
  X,
  ChevronRight,
  Settings,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { MediaCarousel } from "@/components/common/MediaCarousel";
import { DetailViewerModal } from "./DetailViewerModal";

interface IssueDetailModalProps {
  issue: any;
  isOpen: boolean;
  onClose: () => void;
  onEngage: (id: string, action: "agree" | "disagree") => void;
  onComment: (id: string, text: string) => void;
  onViewOnMap?: () => void;
}

export function IssueDetailModal({
  issue,
  isOpen,
  onClose,
  onEngage,
  onComment,
  onViewOnMap,
}: IssueDetailModalProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [viewingDetail, setViewingDetail] = useState<
    "plan" | "resolution" | "rejection" | null
  >(null);

  if (!issue) return null;

  // Prepare Media for Carousel
  const images = issue.files?.images || [];
  const voice = issue.files?.voice;
  const mainMedia = [
    ...images.map((url: string) => ({ type: "image", url } as const)),
    ...(voice ? [{ type: "voice", url: voice } as const] : []),
  ];

  const handleSendComment = () => {
    if (commentText.trim()) {
      onComment(issue.id, commentText);
      setCommentText("");
    }
  };

  const isAgreed = issue.agrees?.includes(user?.uid);
  const isDisagreed = issue.disagrees?.includes(user?.uid);

  // Prepare Data for Detail Modal based on selection
  const getDetailData = () => {
    if (viewingDetail === "plan") {
      return {
        title: "Official Response Plan",
        type: "plan" as const,
        data: {
          description: issue.actionTaken,
          staff: issue.staffAllocated,
          resources: issue.resourcesUsed,
          proofs: issue.planningDocs || [],
          timestamp: issue.updatedAt,
        },
      };
    }
    if (viewingDetail === "resolution") {
      return {
        title: "Resolution Verified",
        type: "resolution" as const,
        data: {
          description: issue.resolutionRemarks,
          proofs: issue.resolutionProofs || [],
          timestamp: issue.resolvedAt,
        },
      };
    }
    if (viewingDetail === "rejection") {
      return {
        title: "Issue Rejected",
        type: "rejection" as const,
        data: {
          description: issue.rejectionReason,
          proofs: issue.rejectionProofs || [],
          timestamp: issue.rejectedAt,
        },
      };
    }
    return null;
  };

  const detailData = getDetailData();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 overflow-hidden flex flex-col md:flex-row bg-card">
          {/* LEFT: Media Section (Using Reusable Carousel) */}
          <div className="w-full md:w-[60%] bg-black/95 relative flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/10 md:hidden z-20"
              onClick={onClose}
            >
              <X className="w-6 h-6" />
            </Button>
            <MediaCarousel media={mainMedia} />
          </div>

          {/* RIGHT: Details & Engagement */}
          <div className="w-full md:w-[40%] flex flex-col h-full bg-card">
            {/* Header */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${issue.uid}`}
                  />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">Reported by User</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">
                      {issue.location}
                    </span>
                  </div>
                </div>
                <div className="ml-auto flex flex-col items-end gap-1.5">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="capitalize">
                      {issue.priority}
                    </Badge>
                    <Badge
                      className={cn(
                        "capitalize",
                        issue.status === "resolved"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      )}
                    >
                      {issue.status}
                    </Badge>
                  </div>
                  {/* SLA Info */}
                  {issue.slaStatus && issue.status !== "resolved" && issue.status !== "rejected" && (
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                        issue.slaStatus === "ON_TRACK" ? "bg-green-50 text-green-700 border-green-200" :
                          issue.slaStatus === "AT_RISK" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                            "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {Math.ceil(issue.daysRemaining || 0)} days left
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        Target: {new Date(issue.slaEndDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {onViewOnMap && (
                    <button
                      onClick={onViewOnMap}
                      className="text-primary hover:underline text-[10px] font-medium flex items-center gap-1"
                    >
                      View on Map <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-bold font-display mb-2">
                {issue.title}
              </h2>
              <ScrollArea className="max-h-[100px]">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {issue.description}
                </p>
              </ScrollArea>
            </div>

            {/* Comments & Resolution Scroll Area */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {/* BUTTONS: Official Response / Verification */}
                {(issue.actionTaken ||
                  issue.status === "in-progress" ||
                  issue.status === "resolved") && (
                    <div
                      onClick={() => setViewingDetail("plan")}
                      className="group cursor-pointer bg-blue-50 hover:bg-blue-100/80 border border-blue-200 p-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                          <Settings className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                          <h3 className="font-bold text-blue-900 text-sm">
                            Official Response Plan
                          </h3>
                          <p className="text-xs text-blue-700 mt-0.5">
                            View action plan, staff & proofs
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  )}

                {issue.status === "resolved" && (
                  <div
                    onClick={() => setViewingDetail("resolution")}
                    className="group cursor-pointer bg-green-50 hover:bg-green-100/80 border border-green-200 p-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                        <CheckCircle className="w-5 h-5 text-green-700" />
                      </div>
                      <div>
                        <h3 className="font-bold text-green-900 text-sm">
                          Resolution Verified
                        </h3>
                        <p className="text-xs text-green-700 mt-0.5">
                          View final remarks & evidence
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-green-400 group-hover:text-green-600 transition-colors" />
                  </div>
                )}

                {issue.status === "rejected" && (
                  <div
                    onClick={() => setViewingDetail("rejection")}
                    className="group cursor-pointer bg-red-50 hover:bg-red-100/80 border border-red-200 p-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                        <X className="w-5 h-5 text-red-700" />
                      </div>
                      <div>
                        <h3 className="font-bold text-red-900 text-sm">
                          Issue Rejected
                        </h3>
                        <p className="text-xs text-red-700 mt-0.5">
                          View rejection reason & evidence
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
                  </div>
                )}

                {/* Stats Bar */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl my-6">
                  <div className="flex gap-6">
                    <button
                      onClick={() => onEngage(issue.id, "agree")}
                      className={cn(
                        "flex flex-col items-center gap-1 transition-colors",
                        isAgreed
                          ? "text-green-500"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ThumbsUp
                        className={cn("w-5 h-5", isAgreed && "fill-current")}
                      />
                      <span className="text-xs font-bold">
                        {issue.agrees?.length || 0}
                      </span>
                    </button>
                    <button
                      onClick={() => onEngage(issue.id, "disagree")}
                      className={cn(
                        "flex flex-col items-center gap-1 transition-colors",
                        isDisagreed
                          ? "text-red-500"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ThumbsDown
                        className={cn("w-5 h-5", isDisagreed && "fill-current")}
                      />
                      <span className="text-xs font-bold">
                        {issue.disagrees?.length || 0}
                      </span>
                    </button>
                  </div>
                  <div className="h-8 w-[1px] bg-border" />
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-xs font-bold">
                      {issue.comments?.length || 0}/3
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold text-sm mb-4">Comments</h3>
                {issue.comments && issue.comments.length > 0 ? (
                  <div className="space-y-4">
                    {issue.comments.map((comment: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex gap-3 text-sm animate-in fade-in slide-in-from-bottom-2"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {comment.userName?.charAt(0) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted/50 p-3 rounded-lg rounded-tl-none flex-1">
                          <p className="font-semibold text-xs mb-1">
                            {comment.userName}
                          </p>
                          <p className="text-muted-foreground">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No comments yet. Be the first to verify!</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer Input */}
            <div className="p-4 border-t border-border/50 bg-card">
              <div className="flex gap-2 relative">
                <Input
                  placeholder={
                    issue.comments?.length >= 3
                      ? "Comment limit reached (3/3)"
                      : "Add a verification comment..."
                  }
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={issue.comments?.length >= 3}
                  className="pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-primary hover:bg-primary/10"
                  onClick={handleSendComment}
                  disabled={!commentText.trim() || issue.comments?.length >= 3}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Comments are strictly moderated. Keep it civil.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Viewer Sub-Modal */}
      {viewingDetail && detailData && (
        <DetailViewerModal
          isOpen={!!viewingDetail}
          onClose={() => setViewingDetail(null)}
          title={detailData.title}
          type={detailData.type}
          data={detailData.data}
        />
      )}
    </>
  );
}
