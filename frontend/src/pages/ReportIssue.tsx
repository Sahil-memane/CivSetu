import { useState } from "react";
import { auth } from "@/lib/firebase";

import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Mic,
  MapPin,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

const categories = [
  { value: "pothole", label: "Pothole", icon: "🕳️" },
  { value: "water", label: "Water Leak/Issue", icon: "💧" },
  { value: "garbage", label: "Garbage Overflow", icon: "🗑️" },
  { value: "streetlight", label: "Street Light", icon: "💡" },
  { value: "drainage", label: "Drainage/Sewage", icon: "🚰" },
  { value: "road", label: "Road Damage", icon: "🛣️" },
  { value: "other", label: "Other", icon: "📋" },
];

const ReportIssue = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // New State for Rejection Modal
  const [isRejected, setIsRejected] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [aiResult, setAiResult] = useState<any>(null);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [voiceFile, setVoiceFile] = useState<Blob | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    address: "",
    coordinates: { lat: 0, lng: 0 },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const filesArray = Array.from(files);
      const newFiles = filesArray.slice(0, 5 - imageFiles.length);

      setImageFiles((prev) => [...prev, ...newFiles]);

      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setRejectionReason(""); // Reset previous rejection

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");
      const token = await currentUser.getIdToken();

      const submitData = new FormData();
      // ... append data ...
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("category", formData.category);
      submitData.append("address", formData.address);
      submitData.append("latitude", formData.coordinates.lat.toString());
      submitData.append("longitude", formData.coordinates.lng.toString());

      imageFiles.forEach((file) => {
        submitData.append("images", file);
      });

      if (voiceFile) {
        submitData.append("voice", voiceFile, "voice-recording.webm");
      }

      const response = await fetch("http://localhost:5000/api/issues/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      if (!response.ok) {
        const errData = await response.json();

        // HANDLE REJECTION SPECIFICALLY
        if (response.status === 400 && errData.isRejected) {
          setRejectionReason(
            errData.rejectionReason || "Issue rejected by AI validation"
          );
          setIsRejected(true); // Trigger Modal
          setIsSubmitting(false); // Stop loading
          return; // Stop execution
        }

        throw new Error(errData.message || "Failed to submit issue");
      }

      const result = await response.json();
      setAiResult(result);
      setIsSubmitting(false);
      setIsSuccess(true);
      toast({
        title: "Issue Reported Successfully!",
        description: `AI assigned priority: ${result.priority.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error("Submission error:", error);
      setIsSubmitting(false);
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getLocation = () => {
    if ("geolocation" in navigator) {
      toast({
        title: "Getting Location...",
        description: "Please wait while we fetch your coordinates.",
      });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          }));
          toast({
            title: "Location detected",
            description: "Coordinates updated successfully.",
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description:
              "Could not retrieve your location. Please check browser permissions.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
    }
  };

  if (isSuccess && aiResult) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card w-full max-w-md p-8 rounded-2xl shadow-xl text-center border border-border/50">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">
            Issue Reported!
          </h2>
          <p className="text-muted-foreground mb-6">
            Thank you for helping improve our city. Your report has been
            submitted.
          </p>

          <div className="bg-muted/50 rounded-xl p-4 mb-8 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">AI Priority Assigned</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  aiResult.priority === "CRITICAL"
                    ? "bg-destructive/10 text-destructive"
                    : aiResult.priority === "HIGH"
                    ? "bg-orange-500/10 text-orange-500"
                    : "bg-blue-500/10 text-blue-500"
                }`}
              >
                {aiResult.priority.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {aiResult.reasoning || "AI verified this issue."}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              variant="hero"
              className="w-full"
              onClick={() => {
                setIsSuccess(false);
                setAiResult(null);
                setFormData({
                  title: "",
                  description: "",
                  category: "",
                  address: "",
                  coordinates: { lat: 0, lng: 0 },
                });
                setImageFiles([]);
                setImagePreviews([]);
                setVoiceFile(null);
              }}
            >
              Report Another Issue
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => (window.location.href = "/dashboard")}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Rejection Modal */}
      <Dialog open={isRejected} onOpenChange={setIsRejected}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center text-xl text-destructive font-bold">
              Submission Rejected
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/20">
              <p className="font-semibold text-sm mb-1">Rejection Reason:</p>
              <p className="text-sm text-muted-foreground">{rejectionReason}</p>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">
                What to do next:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide more specific details in the description.</li>
                <li>Ensure attached photos are clear and relevant.</li>
                <li>Verify the location accuracy.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="sm:justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRejected(false);
                // Optional: Clear form or navigate away? User asked for "Discard" button in concept.
                // But strictly user said "edit issue button... redirects to same issue filling form"
                // So 'Edit' is just closing the modal.
              }}
            >
              Close
            </Button>
            <Button
              variant="hero"
              className="bg-primary text-white hover:bg-primary/90"
              onClick={() => setIsRejected(false)}
            >
              Edit Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="pt-24 pb-16">
        {/* ... form content ... */}
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                Report Issue
              </span>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Report a Civic Issue
              </h1>
              <p className="text-muted-foreground">
                Help improve your community by reporting problems you encounter.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Issue Details */}
              <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-6">
                <div>
                  <Label
                    htmlFor="title"
                    className="text-base font-semibold mb-2 block"
                  >
                    Issue Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the issue"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="h-12"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <span className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              <span>{cat.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="description"
                    className="text-base font-semibold mb-2 block"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide more details about the issue..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                  />
                </div>
              </div>

              {/* Media Upload */}
              <div className="bg-card rounded-2xl border border-border/50 p-6">
                <Label className="text-base font-semibold mb-4 block">
                  Add Photos, Videos, or Documents
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {imagePreviews.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden group"
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-destructive-foreground" />
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 5 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                      <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">
                        Upload
                      </span>
                      <input
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Upload up to 5 files: photos, videos, or documents (PDF, DOC)
                  - max 10MB each
                </p>
              </div>

              {/* Voice Input */}
              <div className="bg-card rounded-2xl border border-border/50 p-6">
                <Label className="text-base font-semibold mb-4 block">
                  Voice Description (Optional)
                </Label>
                <VoiceRecorder
                  onRecordingComplete={(blob) => {
                    setVoiceFile(blob);
                    toast({
                      title: "Voice Recorded",
                      description: "Your voice description has been captured",
                    });
                  }}
                  onTranscriptUpdate={(text) => {
                    setFormData((prev) => ({
                      ...prev,
                      description: text,
                    }));
                  }}
                />
                {voiceFile && (
                  <p className="text-sm text-success mt-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Voice recording ready to submit
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="bg-card rounded-2xl border border-border/50 p-6">
                <Label className="text-base font-semibold mb-2 block">
                  Address / Landmark <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter landmark (e.g. Near Central Park)"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className="flex-1 h-12"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getLocation}
                    className="gap-2 h-12"
                  >
                    <MapPin className="w-4 h-4" />
                    Auto-GPS
                  </Button>
                </div>

                {/* Map Preview */}
                <div className="mt-4 h-48 bg-muted rounded-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,hsl(var(--muted))_25%,hsl(var(--muted))_50%,transparent_50%,transparent_75%,hsl(var(--muted))_75%)] bg-[length:20px_20px] opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground font-semibold">
                        {formData.address || "Location will appear here"}
                      </p>
                      {formData.coordinates.lat !== 0 && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono bg-background/50 px-2 py-1 rounded">
                          GPS: {formData.coordinates.lat.toFixed(6)},{" "}
                          {formData.coordinates.lng.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>Submit Issue Report</>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReportIssue;
