import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Summary } from "@shared/schema";

interface UseSummaryOptions {
  onSummaryComplete?: () => void;
}

export default function useSummary(options?: UseSummaryOptions) {
  const [summaryData, setSummaryData] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState<string>("");
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const { toast } = useToast();

  const summaryMutation = useMutation({
    mutationFn: async (text: string) => {
      setIsSummarizing(true);
      
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate summary");
      }
      
      return response.json() as Promise<Summary>;
    },
    onSuccess: (data) => {
      setSummaryData(data);
      setIsSummarizing(false);
      if (options?.onSummaryComplete) {
        options.onSummaryComplete();
      }
    },
    onError: (error: Error) => {
      setSummaryError(error.message);
      setIsSummarizing(false);
      toast({
        title: "Summary generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateSummary = async (text: string) => {
    setSummaryData(null);
    setSummaryError("");
    return summaryMutation.mutateAsync(text);
  };

  return {
    generateSummary,
    summaryData,
    summaryError,
    isSummarizing,
  };
}