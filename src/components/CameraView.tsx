import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, CameraOff, Loader2, AlertCircle } from 'lucide-react';

export const CameraView = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          setIsStreaming(true);
          setIsLoading(false);
          startPredictionLoop();
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please grant camera permissions.');
      setIsLoading(false);
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

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    setIsStreaming(false);
    setPrediction(null);
    setConfidence(null);
  };

  const startPredictionLoop = async () => {
    // Initialize TensorFlow.js
    await tf.ready();
    
    // Note: In a production app, you would load a trained model here
    // const model = await tf.loadGraphModel('/path/to/model.json');
    
    const predict = async () => {
      if (!videoRef.current || !isStreaming) return;

      try {
        // Capture frame from video
        const video = videoRef.current;
        
        // Create tensor from video frame
        const tensor = tf.browser.fromPixels(video)
          .resizeNearestNeighbor([224, 224]) // Resize to model input size
          .toFloat()
          .div(255.0) // Normalize
          .expandDims();

        // In production, you would run: const predictions = await model.predict(tensor);
        // For demo purposes, we'll simulate a prediction
        simulatePrediction();

        // Clean up
        tensor.dispose();
      } catch (err) {
        console.error('Prediction error:', err);
      }

      animationRef.current = requestAnimationFrame(predict);
    };

    predict();
  };

  // Simulates a pill recognition (in production, this would be real ML prediction)
  const simulatePrediction = () => {
    // This is a placeholder - in production you'd have a trained model
    const mockPills = [
      { name: 'Lisinopril 10mg', confidence: 0.92 },
      { name: 'Metformin 500mg', confidence: 0.88 },
      { name: 'Aspirin 81mg', confidence: 0.85 },
      { name: 'Unknown Pill', confidence: 0.45 }
    ];

    // Randomly select one for demo
    const randomPill = mockPills[Math.floor(Math.random() * mockPills.length)];
    
    // Only show predictions with confidence > 0.7
    if (randomPill.confidence > 0.7) {
      setPrediction(randomPill.name);
      setConfidence(randomPill.confidence);
    } else {
      setPrediction('No pill detected');
      setConfidence(null);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>AI Pill Recognition</AlertTitle>
        <AlertDescription>
          Point your camera at a pill for real-time identification. 
          Note: This is a demo implementation. A production version would use a trained TensorFlow.js model.
        </AlertDescription>
      </Alert>

      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-muted">
          {!isStreaming && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <Camera className="h-16 w-16 mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Camera Not Active</p>
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to start pill identification
              </p>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Starting camera...</p>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isStreaming ? 'hidden' : ''}`}
          />

          <canvas
            ref={canvasRef}
            className="hidden"
          />

          {prediction && isStreaming && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="text-white">
                <p className="text-lg font-semibold">{prediction}</p>
                {confidence && (
                  <p className="text-sm opacity-90">
                    Confidence: {(confidence * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        {!isStreaming ? (
          <Button onClick={startCamera} disabled={isLoading} className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            {isLoading ? 'Starting...' : 'Start Camera'}
          </Button>
        ) : (
          <Button onClick={stopCamera} variant="destructive" className="w-full">
            <CameraOff className="mr-2 h-4 w-4" />
            Stop Camera
          </Button>
        )}
      </div>

      <Alert>
        <AlertTitle>How to use</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>1. Click "Start Camera" to begin</p>
          <p>2. Point your camera at a pill</p>
          <p>3. Hold steady for best results</p>
          <p>4. The AI will identify the pill in real-time</p>
        </AlertDescription>
      </Alert>
    </div>
  );
};