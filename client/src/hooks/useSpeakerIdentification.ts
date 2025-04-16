import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { SpeakerSegment } from "@shared/schema";

interface UseSpeakerIdentificationOptions {
  onIdentificationComplete?: (segments: SpeakerSegment[]) => void;
}

export default function useSpeakerIdentification(options?: UseSpeakerIdentificationOptions) {
  const [speakerSegments, setSpeakerSegments] = useState<SpeakerSegment[]>([]);
  const [identificationError, setIdentificationError] = useState<string>("");
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false);
  const { toast } = useToast();

  const identificationMutation = useMutation({
    mutationFn: async (text: string) => {
      setIsIdentifying(true);
      
      const response = await fetch("/api/identify-speakers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to identify speakers");
      }
      
      return response.json() as Promise<SpeakerSegment[]>;
    },
    onSuccess: (data) => {
      setSpeakerSegments(data);
      setIsIdentifying(false);
      if (options?.onIdentificationComplete) {
        options.onIdentificationComplete(data);
      }
    },
    onError: (error: Error) => {
      setIdentificationError(error.message);
      setIsIdentifying(false);
      toast({
        title: "Speaker identification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const identifySpeakers = async (text: string) => {
    setSpeakerSegments([]);
    setIdentificationError("");
    return identificationMutation.mutateAsync(text);
  };

  return {
    identifySpeakers,
    speakerSegments,
    identificationError,
    isIdentifying,
  };
}