import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Cluster } from "@/utils/clustering";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

interface SurveyCreationFormProps {
  cluster: Cluster;
  onCancel: () => void;
  onSuccess: (survey: any) => void;
}

export function SurveyCreationForm({
  cluster,
  onCancel,
  onSuccess,
}: SurveyCreationFormProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);

  const handleAddQuestion = () => {
    setQuestions([...questions, ""]);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty questions
    const validQuestions = questions.filter((q) => q.trim() !== "");

    if (!title || validQuestions.length === 0) {
      toast.error("Please provide a title and at least one question.");
      return;
    }

    setLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      // Extract user IDs from the cluster's issues to target them
      const uniqueUserIds = Array.from(
        new Set(
          cluster.issues.map((i) => i.uid).filter((uid) => !!uid) // Filter out undefined uids
        )
      );

      if (uniqueUserIds.length === 0) {
        toast.error("No valid users found in this cluster to target.");
        setLoading(false);
        return;
      }

      const payload = {
        title,
        description,
        questions: validQuestions,
        clusterData: {
          id: cluster.id,
          center: cluster.center,
          radius: cluster.radius,
          issueCount: cluster.issues.length,
        },
        targetUserIds: uniqueUserIds,
      };

      const response = await fetch("/api/surveys/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Survey created successfully!");
        onSuccess({
          id: data.id,
          ...payload,
          createdAt: new Date().toISOString(),
          status: "active",
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to create survey");
      }
    } catch (error) {
      console.error("Survey creation failed", error);
      toast.error("Failed to create survey");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm mt-4 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Create Community Survey</h3>
          <p className="text-sm text-muted-foreground">
            Targeting{" "}
            {new Set(cluster.issues.map((i) => i.uid).filter(Boolean)).size}{" "}
            citizens in this cluster
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Survey Title</Label>
          <Input
            id="title"
            placeholder="e.g., Waste Management Feedback"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Explain why you are conducting this survey..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <Label>Questions</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddQuestion}
              className="h-8 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Question
            </Button>
          </div>

          {questions.map((q, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                placeholder={`Question ${idx + 1}`}
                value={q}
                onChange={(e) => handleQuestionChange(idx, e.target.value)}
                required
              />
              {questions.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveQuestion(idx)}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create & Distribute
          </Button>
        </div>
      </form>
    </div>
  );
}
