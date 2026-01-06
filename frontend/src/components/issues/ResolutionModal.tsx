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
import { Loader2, Upload, X, FileCheck, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResolutionModalProps {
  issue: any;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (fileData: FormData) => Promise<void>;
}

export function ResolutionModal({
  issue,
  isOpen,
  onClose,
  onResolve,
}: ResolutionModalProps) {
  const [loading, setLoading] = useState(false);
  const [finalRemarks, setFinalRemarks] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("finalRemarks", finalRemarks);
      files.forEach((file) => {
        formData.append("images", file);
      });

      await onResolve(formData);
      onClose();
    } catch (error) {
      console.error("Resolution failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Finalize Resolution
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          <div className="space-y-4">
            <div className="bg-green-50/50 p-6 rounded-xl border border-green-100 h-full">
              <h4 className="font-semibold text-green-900 mb-2">
                Resolution Checklist
              </h4>
              <ul className="space-y-3 text-sm text-green-800">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Verify all work is completed as per plan.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Ensure site is clean and safe.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Take clear photos of the result.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Attach any final reports or invoices.
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="remarks">Final Remarks / Report</Label>
              <Textarea
                id="remarks"
                placeholder="Summarize the work done..."
                value={finalRemarks}
                onChange={(e) => setFinalRemarks(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="grid gap-2">
              <Label>Resolution Evidence (Photos & Docs)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors relative h-32">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Upload photos and documents
                </p>
                {files.length > 0 && (
                  <div className="mt-2 text-xs font-medium text-primary">
                    {files.length} files selected
                  </div>
                )}
              </div>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1"
                    >
                      <FileCheck className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">
                        {file.name}
                      </span>
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
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Mark Resolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
