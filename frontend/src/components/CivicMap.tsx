import { useState, useEffect, useRef } from "react";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { Issue } from "./issues/IssueCard";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronRight, Clock, AlertTriangle } from "lucide-react";
import { Cluster } from "@/utils/clustering";

interface CivicMapProps {
  issues: Issue[];
  onIssueSelect: (issue: Issue) => void;
  selectedIssueId?: string | null;
  focusTrigger?: number;
  clusters?: Cluster[];
  onClusterSelect?: (cluster: Cluster) => void;
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

// Internal Circle Component using Google Maps API
function MapCircle({
  center,
  radius,
  fillColor,
  strokeColor,
  onClick,
}: {
  center: { lat: number; lng: number };
  radius: number;
  fillColor: string;
  strokeColor: string;
  onClick?: () => void;
}) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create circle
    circleRef.current = new google.maps.Circle({
      strokeColor: strokeColor,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: fillColor,
      fillOpacity: 0.35,
      map: map,
      center: center,
      radius: radius,
      zIndex: 1, // Below markers
      clickable: !!onClick,
    });

    if (onClick) {
      circleRef.current.addListener("click", onClick);
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
    };
  }, [map, center, radius, fillColor, strokeColor, onClick]);

  return null;
}

export function CivicMap({
  issues,
  onIssueSelect,
  selectedIssueId,
  focusTrigger,
  clusters = [],
  onClusterSelect,
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

            {/* Render Clusters */}
            {clusters.map((cluster) => (
              <div key={cluster.id}>
                <MapCircle
                  center={cluster.center}
                  radius={cluster.radius}
                  fillColor="#F97316" // Orange
                  strokeColor="#EA580C"
                  onClick={() => onClusterSelect?.(cluster)}
                />
                <Marker
                  position={cluster.center}
                  label={{
                    text: cluster.issues.length.toString(),
                    color: "white",
                    fontWeight: "bold",
                  }}
                  icon={{
                    path: (window as any).google?.maps?.SymbolPath?.CIRCLE,
                    scale: 0, // Hidden marker, just label
                  }}
                  zIndex={100}
                  onClick={() => onClusterSelect?.(cluster)}
                />
              </div>
            ))}

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
                  {selectedMarker.slaStatus && (
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 px-1.5 ${
                          selectedMarker.slaStatus === "BREACHED"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : selectedMarker.slaStatus === "AT_RISK"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }`}
                      >
                        {selectedMarker.slaStatus === "BREACHED" ? (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {selectedMarker.daysRemaining !== undefined &&
                        selectedMarker.daysRemaining <= 0
                          ? `Overdue`
                          : `${Math.ceil(
                              selectedMarker.daysRemaining || 0
                            )}d left`}
                      </Badge>
                    </div>
                  )}
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
