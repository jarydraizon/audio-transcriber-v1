import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mic, Layers, Globe, Shield } from "lucide-react";

const About = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">About the Audio Transcription Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-slate-700">
            Our audio transcription tool provides a fast, accurate way to convert spoken language from audio files into written text. 
            Powered by OpenAI's Whisper API, it offers state-of-the-art transcription capabilities for a wide range of applications.
          </p>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">High Accuracy</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Delivers precise transcriptions even for challenging audio content
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Multiple File Formats</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Support for MP3, WAV, and M4A audio formats
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Multilingual Support</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Automatically detects and transcribes over 50 languages
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Privacy-Focused</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Your files are securely processed and not stored after transcription
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Use Cases</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li>Transcribing interviews, meetings, and lectures</li>
              <li>Converting podcast episodes to text content</li>
              <li>Creating accessible versions of audio content</li>
              <li>Documenting important conversations</li>
              <li>Generating subtitles for videos</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">How It Works</h3>
            <p className="text-slate-700">
              Our tool utilizes OpenAI's Whisper, a state-of-the-art automatic speech recognition system. 
              When you upload an audio file, it's securely sent to the Whisper API, which processes the 
              audio and returns a text transcription. The entire process typically takes just a few moments, 
              depending on the length and quality of your audio file.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
