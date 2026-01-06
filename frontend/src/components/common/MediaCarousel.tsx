import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Mic, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
  type: "image" | "voice" | "doc" | "video";
  url: string;
}

interface MediaCarouselProps {
  media: MediaItem[];
  onClose?: () => void; // Optional close button overlay for mobile
}

export function MediaCarousel({ media, onClose }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/90 text-white">
        <p className="text-sm text-muted-foreground">No media attachments</p>
      </div>
    );
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const currentItem = media[currentIndex];

  const renderContent = (item: MediaItem) => {
    const isImage = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(item.url);
    const isPdf = /\.(pdf)(\?.*)?$/i.test(item.url);
    const isDoc = /\.(doc|docx|txt)(\?.*)?$/i.test(item.url);

    if (item.type === "voice") {
      return (
        <div className="flex flex-col items-center gap-8 text-white animate-in fade-in zoom-in-50 duration-300 w-full px-10">
          <div className="w-40 h-40 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center relative">
            <Mic className="w-20 h-20 text-primary" />
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20" />
          </div>
          <div className="transform scale-125 origin-center w-full max-w-sm flex justify-center">
            <audio
              controls
              src={item.url}
              className="w-full shadow-xl rounded-full accent-primary"
            />
          </div>
          <p className="text-base text-gray-300 font-medium mt-4">
            Voice Evidence
          </p>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in p-4">
          <iframe
            src={item.url}
            className="w-full h-full rounded-lg bg-white shadow-2xl"
            title="PDF Viewer"
          />
        </div>
      );
    }

    if (isDoc) {
      return (
        <div className="flex flex-col items-center gap-6 text-white animate-in fade-in">
          <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
            <FileText className="w-12 h-12" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Document Attachment</p>
            <Button
              variant="secondary"
              onClick={() => window.open(item.url, "_blank")}
            >
              <FileText className="w-4 h-4 mr-2" />
              View / Download Document
            </Button>
          </div>
        </div>
      );
    }

    // Default to Image
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        <img
          src={
            item.url.startsWith("http")
              ? item.url
              : `http://localhost:5000/${item.url}`
          }
          alt="Issue proof"
          className="w-full h-full object-contain"
        />
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-black/95 relative flex items-center justify-center overflow-hidden">
      {/* Navigation Arrows */}
      {media.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 text-white hover:bg-white/10 z-10"
            onClick={handlePrev}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 text-white hover:bg-white/10 z-10"
            onClick={handleNext}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </>
      )}

      {/* Media Content */}
      <div className="w-full h-full flex items-center justify-center bg-black/40">
        {renderContent(currentItem)}
      </div>

      {/* Dots Indicator */}
      {media.length > 1 && (
        <div className="absolute bottom-4 flex gap-2 z-10">
          {Array.from({ length: media.length }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === currentIndex ? "bg-white w-4" : "bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
