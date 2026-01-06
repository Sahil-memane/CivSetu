import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, FileText, Settings, CheckCircle } from "lucide-react";
import { MediaCarousel } from "@/components/common/MediaCarousel";

interface DetailViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "plan" | "resolution" | "rejection";
  data: {
    description?: string; // Action Taken / Remarks / Reason
    staff?: string;
    resources?: string;
    proofs: string[]; // List of URLs
    timestamp?: string;
  };
}

export function DetailViewerModal({
  isOpen,
  onClose,
  title,
  type,
  data,
}: DetailViewerModalProps) {
  // Normalize proofs to MediaItems
  const mediaItems = data.proofs.map((url) => ({
    type: "image" as const, // We'll let MediaCarousel detect if it's doc/pdf
    url,
  }));

  const getThemeColor = () => {
    switch (type) {
      case "plan":
        return "blue";
      case "resolution":
        return "green";
      case "rejection":
        return "red";
      default:
        return "gray";
    }
  };
  const color = getThemeColor();

  const getIcon = () => {
    switch (type) {
      case "plan":
        return <Settings className={`w-5 h-5 text-${color}-600`} />;
      case "resolution":
        return <CheckCircle className={`w-5 h-5 text-${color}-600`} />;
      case "rejection":
        return <X className={`w-5 h-5 text-${color}-600`} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 overflow-hidden flex flex-col md:flex-row bg-card border-none shadow-2xl">
        {/* LEFT: Media Carousel */}
        <div className="w-full md:w-[60%] h-[40vh] md:h-full bg-black relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10 md:hidden z-20"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
          <MediaCarousel media={mediaItems} />
        </div>

        {/* RIGHT: Details Text */}
        <div className="w-full md:w-[40%] flex flex-col h-full bg-card relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 hidden md:flex text-muted-foreground hover:bg-muted"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>

          <div className={`p-6 border-b border-${color}-100 bg-${color}-50/30`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-full bg-${color}-100`}>
                {getIcon()}
              </div>
              <div>
                <h2 className={`text-lg font-bold text-${color}-900`}>
                  {title}
                </h2>
                {data.timestamp && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(data.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {data.description && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Description / Remarks
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground bg-muted/30 p-4 rounded-lg border border-border">
                    {data.description}
                  </p>
                </div>
              )}

              {(data.staff || data.resources) && (
                <div className="grid grid-cols-2 gap-4">
                  {data.staff && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                        Staff Allocated
                      </h3>
                      <p className="text-sm font-medium">{data.staff}</p>
                    </div>
                  )}
                  {data.resources && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                        Resources Used
                      </h3>
                      <p className="text-sm font-medium">{data.resources}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Evidence Files
                </h3>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {data.proofs.length > 0 ? (
                    <Badge variant="outline" className="gap-1.5 py-1">
                      <FileText className="w-3 h-3" />
                      {data.proofs.length} Files attached (View on Left)
                    </Badge>
                  ) : (
                    <span className="italic">No proofs attached</span>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
