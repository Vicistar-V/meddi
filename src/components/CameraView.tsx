import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, CameraOff, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PillIdentification {
  identified: boolean;
  name: string;
  confidence: number;
  description?: string;
  warning?: string;
}

export const CameraView = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PillIdentification | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzeIntervalRef = useRef<number>();

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('pill-identifier', {
        body: { image: imageData }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data) {
        setResult(data);
        if (data.identified && data.confidence > 0.7) {
          console.log('Pill identified:', data.name, 'Confidence:', data.confidence);
        }
      }
    } catch (error: any) {
      console.error('Error analyzing pill:', error);
      if (error?.message?.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please wait before analyzing again.');
      } else if (error?.message?.includes('credits')) {
        toast.error('AI credits exhausted. Please add credits to continue.');
      } else {
        toast.error('Failed to analyze pill image');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (analyzeIntervalRef.current) {
      clearInterval(analyzeIntervalRef.current);
    }
    
    setIsStreaming(false);
    setResult(null);
  };

  useEffect(() => {
    return () => {
      if (analyzeIntervalRef.current) {
        clearInterval(analyzeIntervalRef.current);
      }
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>AI Pill Recognition</AlertTitle>
        <AlertDescription>
          Point your camera at a pill for real-time identification using Lovable AI vision.
        </AlertDescription>
      </Alert>

      <Card className="relative overflow-hidden">
        <div className="relative aspect-video bg-muted">
          {!isStreaming && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <Camera className="h-16 w-16 mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Camera Not Active</p>
              <p className="text-sm text-muted-foreground">
                Click the button below to start pill identification
              </p>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isStreaming ? 'hidden' : ''}`}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {isAnalyzing && isStreaming && (
            <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing...
            </div>
          )}
          
          {result && isStreaming && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
              {result.identified ? (
                <div className="space-y-2 text-white">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-lg">{result.name}</p>
                    <span className="text-sm opacity-90">
                      {(result.confidence * 100).toFixed(0)}% confident
                    </span>
                  </div>
                  {result.description && (
                    <p className="text-sm opacity-80">{result.description}</p>
                  )}
                  {result.warning && (
                    <p className="text-xs text-orange-300 mt-2">
                      ⚠️ {result.warning}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-white">
                  <p className="text-sm opacity-90">Unable to identify pill</p>
                  <p className="text-xs opacity-70 mt-1">
                    {result.description || "Try adjusting the angle or lighting"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-3">
        {!isStreaming ? (
          <Button onClick={startCamera} className="flex-1">
            <Camera className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
        ) : (
          <>
            <Button onClick={stopCamera} variant="destructive" className="flex-1">
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Camera
            </Button>
            <Button
              onClick={captureAndAnalyze}
              disabled={isAnalyzing}
              variant="secondary"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Analyze Now"
              )}
            </Button>
          </>
        )}
      </div>
      
      <Alert>
        <AlertTitle>How to use</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>1. Click "Start Camera" to begin</p>
          <p>2. Point your camera at a pill and hold steady</p>
          <p>3. Click "Analyze Now" when ready</p>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Tip: Each analysis uses AI credits, so analyze only when you have a clear view
          </p>
          <p className="text-xs text-muted-foreground">
            ⚠️ Always verify pill identification with a pharmacist or doctor
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
};
