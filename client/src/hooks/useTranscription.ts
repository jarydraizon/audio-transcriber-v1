import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Transcription } from "@shared/schema";

interface UseTranscriptionOptions {
  onTranscriptionComplete?: (text: string) => void;
}

export default function useTranscription(options?: UseTranscriptionOptions) {
  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const [transcriptionError, setTranscriptionError] = useState<string>("");
  const [transcriptionProgress, setTranscriptionProgress] = useState<number>(0);
  const [wasCompressed, setWasCompressed] = useState<boolean>(false);
  const { toast } = useToast();

  const transcriptionMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      // Start progress simulation
      simulateProgress();
      
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to transcribe audio");
      }
      
      setTranscriptionProgress(100);
      return response.json() as Promise<Transcription>;
    },
    onSuccess: (data) => {
      setTranscriptionText(data.text);
      // Check if the audio was compressed
      if (data.wasCompressed) {
        setWasCompressed(true);
        toast({
          title: "Audio compressed",
          description: "Your audio file was automatically compressed for better processing.",
          duration: 5000,
        });
      }
      if (options?.onTranscriptionComplete) {
        options.onTranscriptionComplete(data.text);
      }
    },
    onError: (error: Error) => {
      setTranscriptionError(error.message);
      toast({
        title: "Transcription failed",
        description: error.message,
        variant: "destructive",
      });
      if (options?.onTranscriptionComplete) {
        options.onTranscriptionComplete(""); // Pass empty string on error
      }
    },
  });

  const simulateProgress = () => {
    setTranscriptionProgress(0);
    
    const interval = setInterval(() => {
      setTranscriptionProgress((prev) => {
        // Simulate non-linear progress
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        
        const increment = (100 - prev) / 10;
        return prev + increment * Math.random();
      });
    }, 300);
    
    return () => clearInterval(interval);
  };

  const transcribe = async (file: File) => {
    setTranscriptionText("");
    setTranscriptionError("");
    return transcriptionMutation.mutateAsync(file);
  };

  return {
    transcribe,
    transcriptionText,
    transcriptionError,
    transcriptionProgress,
    wasCompressed,
    isTranscribing: transcriptionMutation.isPending,
  };
}
