import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, AlertTriangle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PlanningModalProps {
  issue: any;
  isOpen: boolean;
  onClose: () => void;
  onPlan: (formData: FormData) => Promise<void>;
  onReject: () => void;
}

export function PlanningModal({
  issue,
  isOpen,
  onClose,
  onPlan,
  onReject,
}: PlanningModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    actionTaken: "",
    staffAllocated: "",
    resourcesUsed: "",
  });
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!formData.actionTaken) return;

    setLoading(true);
    try {
      const form = new FormData();
      form.append("status", "in-progress");
      form.append("actionTaken", formData.actionTaken);
      form.append("staffAllocated", formData.staffAllocated);
      form.append("resourcesUsed", formData.resourcesUsed);

      files.forEach((file) => {
        form.append("planningDocs", file);
      });

      await onPlan(form);
      onClose();
    } catch (error) {
      console.error("Planning failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Plan Resolution</span>
            <Badge variant="outline" className="mr-8">
              {issue?.priority} Priority
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">{issue?.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {issue?.description}
              </p>
              <div className="mt-2 text-xs flex gap-2">
                <span className="font-medium">Loc:</span> {issue?.location}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="actionTaken">Implementation Plan</Label>
              <Textarea
                id="actionTaken"
                placeholder="Detailed plan to resolve this issue..."
                value={formData.actionTaken}
                onChange={(e) =>
                  setFormData({ ...formData, actionTaken: e.target.value })
                }
                className="h-32"
              />
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-100 mt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-red-900">
                    Valid Issue?
                  </h5>
                  <p className="text-xs text-red-700 mt-1 mb-3">
                    If this issue is invalid, duplicate, or out of jurisdiction,
                    you can reject it directly.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onReject}
                    className="w-full sm:w-auto"
                  >
                    Reject Issue
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="staff">Staff Allocated</Label>
              <Input
                id="staff"
                placeholder="e.g. Team A, John Doe, etc."
                value={formData.staffAllocated}
                onChange={(e) =>
                  setFormData({ ...formData, staffAllocated: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="resources">Resources/Budget</Label>
              <Input
                id="resources"
                placeholder="e.g. $5000, 2 Trucks, etc."
                value={formData.resourcesUsed}
                onChange={(e) =>
                  setFormData({ ...formData, resourcesUsed: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Supporting Documents</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors relative h-32">
                <input
                  type="file"
                  multiple
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Upload budget, maps, or docs
                </p>
                {files.length > 0 && (
                  <div className="mt-2 text-xs font-medium text-primary">
                    {files.length} files attached
                  </div>
                )}
              </div>

              {files.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="text-xs flex items-center gap-2 text-muted-foreground"
                    >
                      <FileText className="w-3 h-3" /> {f.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.actionTaken || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Allocate & Start
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
