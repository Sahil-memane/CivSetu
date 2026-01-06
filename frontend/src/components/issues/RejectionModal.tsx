import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileWarning } from "lucide-react";

interface RejectionModalProps {
  issue: any;
  isOpen: boolean;
  onClose: () => void;
  onReject: (formData: FormData) => Promise<void>;
}

export function RejectionModal({
  issue,
  isOpen,
  onClose,
  onReject,
}: RejectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("rejectionReason", reason);
      files.forEach((file) => {
        formData.append("rejectionProofs", file);
      });

      await onReject(formData);
      onClose();
    } catch (error) {
      console.error("Rejection failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-l-4 border-l-red-500">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <FileWarning className="w-5 h-5" />
            Reject Issue
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="bg-red-50 p-3 rounded text-xs text-red-800">
            You are about to reject the issue <strong>"{issue?.title}"</strong>.
            This will notify the citizen.
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">
              Reason for Rejection <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g. Duplicate issue, Invalid location, Outside Jurisdiction..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <Label>Proof (Optional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <Upload className="w-6 h-6 text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">
                Attach evidence (photos, docs)
              </p>
              {files.length > 0 && (
                <div className="mt-2 text-xs font-medium text-primary">
                  {files.length} files selected
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || loading}
            variant="destructive"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
