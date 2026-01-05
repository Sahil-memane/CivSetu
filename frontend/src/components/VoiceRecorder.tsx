import { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onTranscriptUpdate?: (transcript: string) => void;
}

export const VoiceRecorder = ({
  onRecordingComplete,
  onTranscriptUpdate,
}: VoiceRecorderProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API (browser-based, free alternative to Google Cloud Speech-to-Text)
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interimText = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcriptPiece + " ";
          } else {
            interimText += transcriptPiece;
          }
        }

        if (finalText) {
          setTranscript((prev) => prev + finalText);
          if (onTranscriptUpdate) {
            onTranscriptUpdate(transcript + finalText);
          }
        }
        setInterimTranscript(interimText);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [transcript, onTranscriptUpdate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setTranscript("");
      setInterimTranscript("");

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Speak clearly to describe the issue",
      });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice input",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      toast({
        title: "Recording Stopped",
        description: `Recorded ${recordingTime} seconds of audio`,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2"
            onClick={startRecording}
          >
            <Mic className="w-4 h-4" />
            Start Voice Input
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            className="flex-1 gap-2 animate-pulse"
            onClick={stopRecording}
          >
            <Square className="w-4 h-4" />
            Stop Recording ({formatTime(recordingTime)})
          </Button>
        )}
      </div>

      {/* Real-time Transcript Display */}
      {isRecording && (transcript || interimTranscript) && (
        <div className="bg-muted rounded-xl p-4">
          <p className="text-sm font-medium mb-2">Live Transcription:</p>
          <Textarea
            value={transcript + interimTranscript}
            readOnly
            className="min-h-[100px] bg-background"
            placeholder="Your speech will appear here..."
          />
          {interimTranscript && (
            <p className="text-xs text-muted-foreground mt-2">
              <span className="italic">{interimTranscript}</span>{" "}
              (processing...)
            </p>
          )}
        </div>
      )}

      {/* Final Transcript */}
      {!isRecording && transcript && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-4">
          <p className="text-sm font-medium text-success mb-2">
            Captured Text:
          </p>
          <p className="text-sm">{transcript}</p>
        </div>
      )}
    </div>
  );
};
