import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, CameraOff, Loader2, AlertCircle, Upload, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMedications, Medication, Schedule, MedicationLog } from "@/hooks/useMedications";

interface PillIdentification {
  identified: boolean;
  name: string;
  confidence: number;
  description?: string;
  warning?: string;
}

interface MedicationMatch {
  exists: boolean;
  medication?: Medication;
  schedules?: Schedule[];
  todayLogs?: MedicationLog[];
  matchType: 'exact' | 'partial' | 'none';
  dosageMismatch?: {
    identified: string;
    inDatabase: string;
  };
}

interface DrugInteractionResult {
  has_interactions: boolean;
  interactions: Array<{
    drug: string;
    severity: 'severe' | 'moderate' | 'minor';
    warning: string;
    recommendation: string;
  }>;
}

interface EnhancedPillResult {
  identification: PillIdentification;
  databaseMatch: MedicationMatch;
  interactions?: DrugInteractionResult;
  contextualInfo: ContextualInfo;
}

interface ContextualInfo {
  shouldTakeNow: boolean;
  nextScheduledTime?: string;
  alreadyTakenToday: boolean;
  timesLeftToday: number;
}

// Helper function to extract dosage from text
const extractDosage = (text: string): string | null => {
  const match = text.match(/(\d+)\s*(mg|mcg|g|ml|iu|%)/i);
  return match ? match[0].toLowerCase() : null;
};

// Fuzzy match medication against user's database
const fuzzyMatchMedication = (
  identifiedName: string, 
  medications: Medication[]
): MedicationMatch => {
  const normalized = identifiedName.toLowerCase().trim();
  
  // Try exact match first
  const exactMatch = medications.find(med => 
    med.name.toLowerCase().trim() === normalized
  );
  
  if (exactMatch) {
    return { exists: true, medication: exactMatch, matchType: 'exact' };
  }
  
  // Try partial match
  const partialMatch = medications.find(med => {
    const medName = med.name.toLowerCase().trim();
    return medName.includes(normalized) || normalized.includes(medName);
  });
  
  if (partialMatch) {
    // Check if dosage differs
    const identifiedDosage = extractDosage(identifiedName);
    const dbDosage = extractDosage(partialMatch.dosage);
    
    if (identifiedDosage && dbDosage && identifiedDosage !== dbDosage) {
      return {
        exists: true,
        medication: partialMatch,
        matchType: 'partial',
        dosageMismatch: {
          identified: identifiedDosage,
          inDatabase: dbDosage
        }
      };
    }
    
    return { exists: true, medication: partialMatch, matchType: 'partial' };
  }
  
  return { exists: false, matchType: 'none' };
};

// Calculate contextual information about medication schedule
const calculateContextualInfo = (
  medication: Medication | undefined,
  schedules: Schedule[],
  todayLogs: MedicationLog[]
): ContextualInfo => {
  if (!medication) {
    return {
      shouldTakeNow: false,
      alreadyTakenToday: false,
      timesLeftToday: 0
    };
  }
  
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const medSchedules = schedules.filter(s => s.medication_id === medication.id);
  const todaySchedules = medSchedules.filter(schedule => 
    schedule.days_of_week.includes(currentDay)
  );
  
  const takenScheduleIds = todayLogs
    .filter(log => log.status === 'taken')
    .map(log => log.schedule_id);
  
  const pendingSchedules = todaySchedules.filter(
    schedule => !takenScheduleIds.includes(schedule.id)
  );
  
  let nextScheduledTime: string | undefined;
  let shouldTakeNow = false;
  
  for (const schedule of pendingSchedules) {
    const [hours, minutes] = schedule.time_to_take.split(':').map(Number);
    const scheduleTime = hours * 60 + minutes;
    
    if (Math.abs(currentTime - scheduleTime) <= 30) {
      shouldTakeNow = true;
      nextScheduledTime = schedule.time_to_take;
      break;
    }
    
    if (scheduleTime > currentTime) {
      if (!nextScheduledTime) {
        nextScheduledTime = schedule.time_to_take;
      }
    }
  }
  
  return {
    shouldTakeNow,
    nextScheduledTime,
    alreadyTakenToday: takenScheduleIds.length > 0,
    timesLeftToday: pendingSchedules.length
  };
};

// Format time string
const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Get severity color classes
const getSeverityColor = (severity: 'severe' | 'moderate' | 'minor') => {
  switch (severity) {
    case 'severe': return 'text-red-600 bg-red-50 border-red-200';
    case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'minor': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  }
};

export const CameraView = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<EnhancedPillResult | null>(null);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const streamRef = useRef<MediaStream | null>(null);
  const analyzeIntervalRef = useRef<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { medications, schedules, todayLogs } = useMedications();

  // Check drug interactions
  const checkDrugInteractions = async (
    medicationName: string
  ): Promise<DrugInteractionResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'drug-interaction-checker',
        { body: { medication_name: medicationName } }
      );
      
      if (error) throw error;
      return data as DrugInteractionResult;
    } catch (error) {
      console.error('Error checking interactions:', error);
      return null;
    }
  };

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    setResult(null);
    setLoadingStage('Identifying pill...');

    try {
      // Step 1: Identify the pill using AI
      const { data: identificationData, error: identError } = await supabase.functions.invoke(
        'pill-identifier',
        { body: { image: imageData } }
      );

      if (identError) throw identError;
      const identification = identificationData as PillIdentification;

      // Low confidence warning
      if (identification.identified && identification.confidence < 0.7) {
        toast.warning(
          `Low confidence (${(identification.confidence * 100).toFixed(0)}%). Please verify with label or pharmacist.`
        );
      }

      setLoadingStage('Checking database...');

      // Step 2: Match against user's database
      const databaseMatch = identification.identified 
        ? fuzzyMatchMedication(identification.name, medications)
        : { exists: false, matchType: 'none' as const };

      setLoadingStage('Checking interactions...');

      // Step 3: Check drug interactions if identified
      let interactions: DrugInteractionResult | undefined;
      if (identification.identified && identification.confidence > 0.7) {
        const interactionResult = await checkDrugInteractions(identification.name);
        if (interactionResult) {
          interactions = interactionResult;
        }
      }

      setLoadingStage('');

      // Step 4: Calculate contextual information
      const contextualInfo = calculateContextualInfo(
        databaseMatch.medication,
        schedules,
        todayLogs
      );

      // Step 5: Combine all information
      const enhancedResult: EnhancedPillResult = {
        identification,
        databaseMatch,
        interactions,
        contextualInfo
      };

      setResult(enhancedResult);

      // Show appropriate toast
      if (identification.identified) {
        if (databaseMatch.exists) {
          toast.success(`Identified: ${identification.name} - Found in your medications!`);
        } else {
          toast.info(`Identified: ${identification.name} - Not in your list`);
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
      setLoadingStage('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        analyzeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

    await analyzeImage(imageData);
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
              {loadingStage || 'Analyzing...'}
            </div>
          )}
          
          {result && isStreaming && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
              {result.identification.identified ? (
                <div className="space-y-2 text-white">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-lg">{result.identification.name}</p>
                    <span className="text-sm opacity-90">
                      {(result.identification.confidence * 100).toFixed(0)}% confident
                    </span>
                  </div>
                  
                  {result.databaseMatch.exists ? (
                    <div className="flex items-center gap-2">
                      <span className="text-success text-sm">✓ In your medications</span>
                      {result.contextualInfo.shouldTakeNow && (
                        <span className="text-blue-400 text-sm">• Time to take</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-yellow-400 text-sm">⚠️ Not in your list</span>
                  )}
                  
                  {result.interactions?.has_interactions && (
                    <p className="text-xs text-red-300">
                      ⚠️ {result.interactions.interactions.length} interaction(s) detected
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-white">
                  <p className="text-sm opacity-90">Unable to identify pill</p>
                  <p className="text-xs opacity-70 mt-1">
                    {result.identification.description || "Try adjusting the angle or lighting"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Smart Context-Aware Result Display */}
      {result && !isStreaming && (
        <div className="space-y-3">
          {/* Basic Identification Card */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">
                {result.identification.identified 
                  ? result.identification.name 
                  : "Unable to Identify"}
              </h3>
              {result.identification.identified && (
                <span className="text-sm text-muted-foreground">
                  {(result.identification.confidence * 100).toFixed(0)}% confident
                </span>
              )}
            </div>

            {result.identification.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {result.identification.description}
              </p>
            )}

            {result.identification.warning && (
              <Alert className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {result.identification.warning}
                </AlertDescription>
              </Alert>
            )}
          </Card>

          {/* Database Match Information */}
          {result.identification.identified && (
            <>
              {result.databaseMatch.exists ? (
                <Card className="p-4 border-success/30 bg-success-light">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-success-dark">
                          Found in Your Medications
                        </p>
                        {result.databaseMatch.matchType === 'partial' && (
                          <p className="text-xs text-success-dark/70">Partial name match</p>
                        )}
                      </div>
                    </div>

                    {/* Dosage Mismatch Warning */}
                    {result.databaseMatch.dosageMismatch && (
                      <Alert className="border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-700">
                        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <AlertTitle className="text-orange-900 dark:text-orange-100">Dosage Mismatch Detected</AlertTitle>
                        <AlertDescription className="text-sm text-orange-800 dark:text-orange-200">
                          <p>Identified: <strong>{result.databaseMatch.dosageMismatch.identified}</strong></p>
                          <p>In your list: <strong>{result.databaseMatch.dosageMismatch.inDatabase}</strong></p>
                          <p className="mt-1">⚠️ Please verify with your pharmacist before taking.</p>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Schedule Information */}
                    {!result.databaseMatch.dosageMismatch && (
                      <div className="space-y-2">
                        {result.contextualInfo.shouldTakeNow ? (
                          <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700">
                            <Clock className="h-4 w-4" />
                            <AlertTitle className="text-blue-900 dark:text-blue-100">Time to Take This Medication</AlertTitle>
                            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                              Scheduled for: {result.contextualInfo.nextScheduledTime && 
                                formatTime(result.contextualInfo.nextScheduledTime)}
                            </AlertDescription>
                          </Alert>
                        ) : result.contextualInfo.alreadyTakenToday ? (
                          <div className="text-sm text-muted-foreground">
                            <p>✓ Already taken today</p>
                            {result.contextualInfo.timesLeftToday > 0 && (
                              <p>
                                {result.contextualInfo.timesLeftToday} dose(s) remaining today
                                {result.contextualInfo.nextScheduledTime && 
                                  ` at ${formatTime(result.contextualInfo.nextScheduledTime)}`}
                              </p>
                            )}
                          </div>
                        ) : result.contextualInfo.nextScheduledTime ? (
                          <div className="text-sm text-muted-foreground">
                            <p>Next scheduled: {formatTime(result.contextualInfo.nextScheduledTime)}</p>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            <p>No scheduled doses remaining today</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="p-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-700">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                        Not in Your Medication List
                      </p>
                    </div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      This medication is not currently in your tracked medications.
                    </p>
                  </div>
                </Card>
              )}

              {/* Drug Interactions Warning */}
              {result.interactions && result.interactions.has_interactions && (
                <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <p className="font-semibold text-red-900 dark:text-red-100">
                        ⚠️ Drug Interactions Detected
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      {result.interactions.interactions.slice(0, 2).map((interaction, idx) => (
                        <Alert 
                          key={idx}
                          className={`border ${getSeverityColor(interaction.severity)}`}
                        >
                          <AlertTitle className="text-sm font-semibold">
                            Interacts with: {interaction.drug}
                          </AlertTitle>
                          <AlertDescription className="text-xs mt-1">
                            <p>{interaction.warning}</p>
                            <p className="mt-1 italic">{interaction.recommendation}</p>
                          </AlertDescription>
                        </Alert>
                      ))}
                      
                      {result.interactions.interactions.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{result.interactions.interactions.length - 2} more interaction(s)
                        </p>
                      )}
                    </div>

                    <Alert className="border-red-300 bg-red-100 dark:bg-red-900/20">
                      <AlertDescription className="text-xs text-red-900 dark:text-red-100">
                        <strong>Important:</strong> Consult your doctor or pharmacist before taking this medication.
                      </AlertDescription>
                    </Alert>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Clear Results Button */}
          <Button 
            onClick={() => setResult(null)} 
            variant="outline" 
            className="w-full"
          >
            Clear Results & Scan Another
          </Button>
        </div>
      )}

      <div className="flex gap-3">
        {!isStreaming ? (
          <>
            <Button onClick={startCamera} className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isAnalyzing}
              />
              <Button 
                variant="outline" 
                disabled={isAnalyzing}
                className="pointer-events-none"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingStage && <span className="text-xs">{loadingStage}</span>}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </>
                )}
              </Button>
            </div>
          </>
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
          <p><strong>Option 1: Live Camera</strong></p>
          <p>1. Click "Start Camera" to begin</p>
          <p>2. Point your camera at a pill and hold steady</p>
          <p>3. Click "Analyze Now" when ready</p>
          <p className="mt-3"><strong>Option 2: Upload Image</strong></p>
          <p>1. Click "Upload Image" to select a photo from your device</p>
          <p>2. Choose a clear photo of the pill</p>
          <p>3. Analysis will start automatically</p>
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
