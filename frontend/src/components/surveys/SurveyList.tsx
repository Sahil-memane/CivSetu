import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";

export function SurveyList() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [responses, setResponses] = useState<{ [key: number]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchSurveys = async () => {
    if (!user) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      const currentUserId = auth.currentUser?.uid;

      if (!token || !currentUserId) {
        console.error("No auth token or user ID available");
        return;
      }

      // Fetch surveys targeted at THIS citizen
      const response = await fetch(
        `http://localhost:5000/api/surveys?userId=${currentUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched surveys for citizen:", data.surveys?.length || 0);
        setSurveys(data.surveys || []);
      } else {
        console.error("Failed to fetch surveys:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch surveys", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [user]);

  const handleResponseChange = (questionIdx: number, value: string) => {
    setResponses((prev) => ({ ...prev, [questionIdx]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedSurvey) return;
    setSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `http://localhost:5000/api/surveys/${selectedSurvey.id}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ responses }),
        }
      );

      if (response.ok) {
        toast.success("Survey submitted. Thank you for your feedback!");
        setSelectedSurvey(null);
        setResponses({});
        // Optionally hide this survey from the list locally or refetch
        setSurveys((prev) => prev.filter((s) => s.id !== selectedSurvey.id));
      } else {
        toast.error("Failed to submit survey.");
      }
    } catch (error) {
      console.error("Error submitting survey", error);
      toast.error("Error submitting survey.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null; // Or a small spinner
  if (surveys.length === 0) return null;

  return (
    <div className="mb-8 space-y-4">
      <h3 className="text-xl font-display font-bold flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-primary" />
        Active Community Surveys
      </h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {surveys.map((survey) => (
          <Card key={survey.id} className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">{survey.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {survey.description}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Dialog onOpenChange={(open) => !open && setResponses({})}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => setSelectedSurvey(survey)}
                    className="w-full"
                  >
                    Participate Now
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{survey.title}</DialogTitle>
                    <DialogDescription>{survey.description}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {survey.questions.map((q: string, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <Label>{q}</Label>
                        <Input
                          value={responses[idx] || ""}
                          onChange={(e) =>
                            handleResponseChange(idx, e.target.value)
                          }
                          placeholder="Your answer..."
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedSurvey(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                      {submitting && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Submit Response
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
