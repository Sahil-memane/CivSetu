import { useState, useEffect } from "react";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { Issue } from "./issues/IssueCard";
import { Button } from "./ui/button";
import { ChevronRight } from "lucide-react";

interface CivicMapProps {
  issues: Issue[];
  onIssueSelect: (issue: Issue) => void;
  selectedIssueId?: string | null;
  focusTrigger?: number;
}

const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };

// Component to handle camera updates
function MapCameraControl({
  selectedIssueId,
  issues,
  focusTrigger,
}: {
  selectedIssueId?: string | null;
  issues: Issue[];
  focusTrigger?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedIssueId) return;

    const issue = issues.find((i) => i.id === selectedIssueId);
    const coords = (issue as any)?.coordinates;
    if (issue && coords && coords.lat && coords.lng) {
      map.panTo({ lat: coords.lat, lng: coords.lng });
      map.setZoom(16);
    }
  }, [map, selectedIssueId, issues, focusTrigger]);

  return null;
}

export function CivicMap({
  issues,
  onIssueSelect,
  selectedIssueId,
  focusTrigger,
}: CivicMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const [selectedMarker, setSelectedMarker] = useState<Issue | null>(null);

  // If apiKey is missing, show a friendly error or fallback
  if (!apiKey) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center p-6 text-center">
        <div>
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Google Maps API Key Missing
          </h3>
          <p className="text-muted-foreground">
            Please set VITE_GOOGLE_MAPS_API_KEY in your environment.
          </p>
        </div>
      </div>
    );
  }

  // Sync internal selection with prop if needed
  useEffect(() => {
    if (selectedIssueId) {
      const issue = issues.find((i) => i.id === selectedIssueId);
      if (issue) setSelectedMarker(issue);
    } else {
      setSelectedMarker(null);
    }
  }, [selectedIssueId, issues]);

  return (
    <div className="flex justify-center w-full">
      <div className="w-[90%] h-[500px] rounded-2xl overflow-hidden shadow-xl border border-border/50">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={PUNE_CENTER}
            defaultZoom={12}
            className="w-full h-full"
            disableDefaultUI={false}
            gestureHandling={"greedy"}
          >
            <MapCameraControl
              selectedIssueId={selectedIssueId}
              issues={issues}
              focusTrigger={focusTrigger}
            />

            {issues.map((issue) => {
              // Ensure coordinates exist
              const coords = (issue as any).coordinates;
              const lat = typeof coords?.lat === "number" ? coords.lat : 0;
              const lng = typeof coords?.lng === "number" ? coords.lng : 0;

              if (lat === 0 && lng === 0) return null;

              return (
                <Marker
                  key={issue.id}
                  position={{ lat, lng }}
                  onClick={() => {
                    setSelectedMarker(issue);
                    onIssueSelect(issue);
                  }}
                />
              );
            })}

            {selectedMarker && (
              <InfoWindow
                position={{
                  lat: selectedMarker.coordinates?.lat || 0,
                  lng: selectedMarker.coordinates?.lng || 0,
                }}
                onCloseClick={() => setSelectedMarker(null)}
                headerContent={
                  <span className="font-bold text-sm text-black">
                    {selectedMarker.category}
                  </span>
                }
              >
                <div className="p-1 max-w-[200px] text-black">
                  <h4 className="font-semibold text-sm mb-1">
                    {selectedMarker.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {selectedMarker.description}
                  </p>
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => onIssueSelect(selectedMarker)}
                  >
                    View Details <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
