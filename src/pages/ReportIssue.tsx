import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Mic, MapPin, Upload, X, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { value: "pothole", label: "Pothole", icon: "🕳️" },
  { value: "water", label: "Water Leak/Issue", icon: "💧" },
  { value: "garbage", label: "Garbage Overflow", icon: "🗑️" },
  { value: "streetlight", label: "Street Light", icon: "💡" },
  { value: "drainage", label: "Drainage/Sewage", icon: "🚰" },
  { value: "road", label: "Road Damage", icon: "🛣️" },
  { value: "other", label: "Other", icon: "📋" },
];

const priorities = [
  { value: "low", label: "Low - Minor inconvenience" },
  { value: "medium", label: "Medium - Moderate impact" },
  { value: "high", label: "High - Significant issue" },
  { value: "critical", label: "Critical - Safety hazard" },
];

const ReportIssue = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
    location: "",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
      setImages((prev) => [...prev, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    toast({
      title: "Issue Reported Successfully!",
      description: "Your civic issue has been submitted and will be reviewed shortly.",
    });
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
          }));
          toast({
            title: "Location Detected",
            description: "Your current location has been captured.",
          });
        },
        () => {
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please enter manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center animate-scale-in">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <h1 className="font-display text-3xl font-bold mb-4">Issue Reported!</h1>
              <p className="text-muted-foreground mb-8">
                Thank you for making your community better. Your issue has been submitted and 
                will be reviewed by the relevant authorities. You'll receive updates on your dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" onClick={() => setIsSuccess(false)}>
                  Report Another Issue
                </Button>
                <Button variant="outline" asChild>
                  <a href="/dashboard">View My Dashboard</a>
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
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
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Image Upload */}
              <div className="bg-card rounded-2xl border border-border/50 p-6">
                <Label className="text-base font-semibold mb-4 block">Add Photos/Videos</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-destructive-foreground" />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                      <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Upload up to 5 photos or videos (max 10MB each)
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 gap-2">
                  <Camera className="w-4 h-4" />
                  Take Photo
                </Button>
                <Button type="button" variant="outline" className="flex-1 gap-2">
                  <Mic className="w-4 h-4" />
                  Voice Input
                </Button>
              </div>

              {/* Issue Details */}
              <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-6">
                <div>
                  <Label htmlFor="title" className="text-base font-semibold mb-2 block">
                    Issue Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the issue"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
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
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
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

                  <div>
                    <Label className="text-base font-semibold mb-2 block">Priority Level</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((pri) => (
                          <SelectItem key={pri.value} value={pri.value}>
                            {pri.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-base font-semibold mb-2 block">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide more details about the issue..."
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="bg-card rounded-2xl border border-border/50 p-6">
                <Label className="text-base font-semibold mb-2 block">
                  Location <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter location or use GPS"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    className="flex-1 h-12"
                  />
                  <Button type="button" variant="outline" onClick={getLocation} className="gap-2 h-12">
                    <MapPin className="w-4 h-4" />
                    Detect
                  </Button>
                </div>
                
                {/* Map Preview */}
                <div className="mt-4 h-48 bg-muted rounded-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,hsl(var(--muted))_25%,hsl(var(--muted))_50%,transparent_50%,transparent_75%,hsl(var(--muted))_75%)] bg-[length:20px_20px] opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {formData.location || "Location will appear here"}
                      </p>
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
                  <>
                    Submit Issue Report
                  </>
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
