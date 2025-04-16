import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Mic, Upload, Copy, Download, X, FileAudio } from "lucide-react";
import useTranscription from "@/hooks/useTranscription";
import { formatFileSize, validateAudioFile } from "@/lib/fileUtils";

const TranscriptionTool = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { 
    transcribe, 
    transcriptionText, 
    transcriptionError, 
    transcriptionProgress, 
    isTranscribing 
  } = useTranscription({
    onTranscriptionComplete: () => {
      setStep(3);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file?: File) => {
    setFileError("");
    
    if (!file) {
      return;
    }
    
    const error = validateAudioFile(file);
    if (error) {
      setFileError(error);
      return;
    }
    
    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startTranscription = async () => {
    if (!selectedFile || fileError) {
      return;
    }
    
    setStep(2);
    await transcribe(selectedFile);
  };

  const copyTranscription = () => {
    if (!transcriptionText) return;
    
    navigator.clipboard.writeText(transcriptionText)
      .then(() => {
        setCopySuccess(true);
        toast({
          title: "Success",
          description: "Transcription copied to clipboard!",
          duration: 2000,
        });
        setTimeout(() => {
          setCopySuccess(false);
        }, 2000);
      })
      .catch(err => {
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      });
  };

  const downloadTranscription = () => {
    if (!transcriptionText || !selectedFile) return;
    
    const blob = new Blob([transcriptionText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    
    // Create filename from original audio filename
    const filenameParts = selectedFile.name.split(".");
    filenameParts.pop(); // Remove extension
    const transcriptFilename = `${filenameParts.join(".")}_transcript.txt`;
    
    a.href = url;
    a.download = transcriptFilename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  const resetApp = () => {
    setStep(1);
    setSelectedFile(null);
    setFileError("");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Audio to Text Converter</h2>
            {step > 1 && (
              <span 
                onClick={resetApp} 
                className="text-sm text-primary cursor-pointer hover:text-primary/80 font-medium"
              >
                Start over
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-between">
              <div className="flex items-center">
                <span 
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 1 ? "bg-primary text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  1
                </span>
                <span className="ml-2 text-sm font-medium text-slate-700">Upload</span>
              </div>
              <div className="flex items-center">
                <span 
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 2 ? "bg-primary text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  2
                </span>
                <span className="ml-2 text-sm font-medium text-slate-700">Transcribe</span>
              </div>
              <div className="flex items-center">
                <span 
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 3 ? "bg-primary text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  3
                </span>
                <span className="ml-2 text-sm font-medium text-slate-700">Results</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: File Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                }}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed ${
                  dragOver ? "border-primary bg-primary/5" : "border-slate-200"
                } rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-slate-400 mb-3" />
                <p className="text-sm text-slate-700 font-medium mb-1">
                  Drag and drop your audio file, or click to browse
                </p>
                <p className="text-xs text-slate-500">
                  Supports MP3, WAV, M4A (Max 50MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a"
                />
              </div>
              
              {selectedFile && (
                <div className="bg-slate-50 p-4 rounded-md">
                  <div className="flex items-start space-x-3">
                    <FileAudio className="h-6 w-6 text-slate-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="text-slate-400 hover:text-slate-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {fileError && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{fileError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={startTranscription}
                  disabled={!selectedFile || !!fileError}
                  className={!selectedFile || !!fileError ? "bg-slate-300 cursor-not-allowed" : ""}
                >
                  Continue to Transcription
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Transcription Process */}
          {step === 2 && (
            <div className="space-y-6">
              {selectedFile && (
                <div className="bg-slate-50 p-4 rounded-md">
                  <div className="flex items-start space-x-3">
                    <FileAudio className="h-6 w-6 text-slate-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center py-6">
                <div className="relative mx-auto h-24 w-24 mb-4">
                  <svg className="animate-spin h-full w-full text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900">Transcribing your audio</h3>
                <p className="mt-1 text-sm text-slate-500">This may take a few minutes depending on the file size.</p>
              </div>

              <div className="bg-slate-50 rounded-md p-4">
                <div className="mb-2 flex justify-between items-center">
                  <p className="text-sm font-medium text-slate-700">Processing progress</p>
                  <p className="text-sm font-medium text-slate-900">{`${Math.round(transcriptionProgress)}%`}</p>
                </div>
                <Progress value={transcriptionProgress} className="w-full h-2.5" />
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && (
            <div className="space-y-6">
              {transcriptionError && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{transcriptionError}</p>
                    </div>
                  </div>
                </div>
              )}

              {!transcriptionError && (
                <>
                  <div className="bg-slate-50 p-4 rounded-t-md border border-slate-200 flex justify-between items-center">
                    <h3 className="text-sm font-medium text-slate-900">Transcription Results</h3>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={copyTranscription} 
                        variant="outline" 
                        size="sm" 
                        className="h-8"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button 
                        onClick={downloadTranscription} 
                        size="sm" 
                        className="h-8"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="border border-t-0 border-slate-200 rounded-b-md h-64 overflow-y-auto p-4 bg-white">
                    <p className="text-sm text-slate-700 whitespace-pre-line">
                      {transcriptionText}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Additional information */}
      <div className="mt-8 space-y-6">
        <Card className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-lg font-medium text-slate-900">About this tool</h2>
          </div>
          <div className="px-6 py-5 text-sm text-slate-700">
            <p>This audio transcription tool uses OpenAI's Whisper API to convert spoken language in audio files to text. It supports common audio formats including MP3, WAV, and M4A with a maximum file size of 50MB.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-slate-50 rounded-md p-4">
                <h3 className="text-sm font-medium text-slate-900 mb-1">Supported Languages</h3>
                <p className="text-sm text-slate-600">Automatically detects and transcribes 50+ languages</p>
              </div>
              <div className="bg-slate-50 rounded-md p-4">
                <h3 className="text-sm font-medium text-slate-900 mb-1">Privacy</h3>
                <p className="text-sm text-slate-600">Files are processed securely and not stored after transcription</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TranscriptionTool;
