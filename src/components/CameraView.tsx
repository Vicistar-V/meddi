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
    <div className="space-y-6">
      {/* Premium Camera View */}
      <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-border/50">
        <div className="relative aspect-[4/3] md:aspect-video bg-gradient-to-br from-muted/50 to-muted">
          {!isStreaming && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                <Camera className="relative h-20 w-20 text-primary/60 mb-6" />
              </div>
              <p className="text-xs text-muted-foreground/70 max-w-xs">
                Ready to identify
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
            <div className="absolute top-6 right-6 bg-background/95 border border-border/50 px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-foreground font-medium">{loadingStage || 'Analyzing'}</span>
            </div>
          )}
          
          {result && isStreaming && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-6 animate-in slide-in-from-bottom-6">
              {result.identification.identified ? (
                <div className="space-y-3 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-xl">{result.identification.name}</p>
                    <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {(result.identification.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  {result.databaseMatch.exists ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-green-300 font-medium">In your medications</span>
                      {result.contextualInfo.shouldTakeNow && (
                        <span className="text-blue-300">• Time to take</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                      <span className="text-yellow-300">Not in your list</span>
                    </div>
                  )}
                  
                  {result.interactions?.has_interactions && (
                    <div className="flex items-center gap-2 text-xs text-red-300">
                      <AlertCircle className="h-3 w-3" />
                      {result.interactions.interactions.length} interaction(s) detected
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-white space-y-2">
                  <p className="text-sm font-medium opacity-90">Unable to identify pill</p>
                  <p className="text-xs opacity-70">
                    {result.identification.description || "Try adjusting the angle or lighting"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Floating Capture Button - Only when streaming */}
          {isStreaming && !isAnalyzing && (
            <button
              onClick={captureAndAnalyze}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full bg-primary shadow-2xl shadow-primary/50 hover:scale-110 active:scale-95 transition-transform duration-200 flex items-center justify-center animate-in zoom-in"
            >
              <Camera className="h-7 w-7 text-primary-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Smart Context-Aware Result Display */}
      {result && !isStreaming && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Basic Identification Card */}
          <Card className="p-6 shadow-lg border-border/50">
            <div className="flex items-start justify-between mb-4 gap-4">
              <h3 className="font-bold text-xl">
                {result.identification.identified 
                  ? result.identification.name 
                  : "Unable to Identify"}
              </h3>
              {result.identification.identified && (
                <span className="text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground font-medium whitespace-nowrap">
                  {(result.identification.confidence * 100).toFixed(0)}% confident
                </span>
              )}
            </div>

            {result.identification.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {result.identification.description}
              </p>
            )}

            {result.identification.warning && (
              <Alert className="mb-0 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-sm text-orange-900 dark:text-orange-100">
                  {result.identification.warning}
                </AlertDescription>
              </Alert>
            )}
          </Card>

          {/* Database Match Information */}
          {result.identification.identified && (
            <>
              {result.databaseMatch.exists ? (
                <Card className="p-6 border-green-200/50 bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-green-900 dark:text-green-100">
                          Found in Your Medications
                        </p>
                        {result.databaseMatch.matchType === 'partial' && (
                          <p className="text-xs text-green-700 dark:text-green-300">Partial name match</p>
                        )}
                      </div>
                    </div>

                    {/* Dosage Mismatch Warning */}
                    {result.databaseMatch.dosageMismatch && (
                      <Alert className="border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:bg-orange-950/20 dark:border-orange-700 shadow-sm">
                        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <AlertTitle className="text-orange-900 dark:text-orange-100 font-bold">Dosage Mismatch</AlertTitle>
                        <AlertDescription className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                          <p>Identified: <strong>{result.databaseMatch.dosageMismatch.identified}</strong></p>
                          <p>In your list: <strong>{result.databaseMatch.dosageMismatch.inDatabase}</strong></p>
                          <p className="mt-2">⚠️ Verify with pharmacist before taking</p>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Schedule Information */}
                    {!result.databaseMatch.dosageMismatch && (
                      <div className="space-y-3">
                        {result.contextualInfo.shouldTakeNow ? (
                          <Alert className="border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:bg-blue-950/20 dark:border-blue-700 shadow-sm">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-900 dark:text-blue-100 font-bold">Time to Take</AlertTitle>
                            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                              Scheduled for: {result.contextualInfo.nextScheduledTime && 
                                formatTime(result.contextualInfo.nextScheduledTime)}
                            </AlertDescription>
                          </Alert>
                        ) : result.contextualInfo.alreadyTakenToday ? (
                          <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 space-y-1">
                            <p className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Already taken today
                            </p>
                            {result.contextualInfo.timesLeftToday > 0 && (
                              <p className="pl-6">
                                {result.contextualInfo.timesLeftToday} dose(s) remaining
                                {result.contextualInfo.nextScheduledTime && 
                                  ` at ${formatTime(result.contextualInfo.nextScheduledTime)}`}
                              </p>
                            )}
                          </div>
                        ) : result.contextualInfo.nextScheduledTime ? (
                          <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                            <p>Next scheduled: <strong>{formatTime(result.contextualInfo.nextScheduledTime)}</strong></p>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                            <p>No scheduled doses remaining today</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="p-6 border-yellow-200/50 bg-gradient-to-br from-yellow-50/50 to-yellow-100/30 dark:bg-yellow-950/20 dark:border-yellow-700 shadow-lg">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      <p className="font-bold text-yellow-900 dark:text-yellow-100">
                        Not in Your List
                      </p>
                    </div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
                      This medication isn't currently tracked
                    </p>
                  </div>
                </Card>
              )}

              {/* Drug Interactions Warning */}
              {result.interactions && result.interactions.has_interactions && (
                <Card className="p-6 border-red-200/50 bg-gradient-to-br from-red-50/50 to-red-100/30 dark:bg-red-950/20 dark:border-red-800 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                        <AlertCircle className="h-6 w-6 text-white" />
                      </div>
                      <p className="font-bold text-red-900 dark:text-red-100">
                        Drug Interactions Detected
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {result.interactions.interactions.slice(0, 2).map((interaction, idx) => (
                        <Alert 
                          key={idx}
                          className={`border shadow-sm ${getSeverityColor(interaction.severity)}`}
                        >
                          <AlertTitle className="text-sm font-bold">
                            Interacts with: {interaction.drug}
                          </AlertTitle>
                          <AlertDescription className="text-xs mt-2 space-y-1">
                            <p>{interaction.warning}</p>
                            <p className="italic">{interaction.recommendation}</p>
                          </AlertDescription>
                        </Alert>
                      ))}
                      
                      {result.interactions.interactions.length > 2 && (
                        <p className="text-xs text-muted-foreground pl-1">
                          +{result.interactions.interactions.length - 2} more interaction(s)
                        </p>
                      )}
                    </div>

                    <Alert className="border-red-300 bg-gradient-to-br from-red-100 to-red-50 dark:bg-red-900/30 shadow-sm">
                      <AlertDescription className="text-xs text-red-900 dark:text-red-100 font-medium">
                        <strong>Important:</strong> Consult your doctor or pharmacist before taking
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
            className="w-full h-12 rounded-xl font-medium hover:bg-accent transition-all"
          >
            Clear & Scan Another
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isStreaming ? (
          <>
            <Button 
              onClick={startCamera} 
              className="flex-1 h-14 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Camera className="mr-2 h-5 w-5" />
              Start Camera
            </Button>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isAnalyzing}
              />
              <Button 
                variant="outline" 
                disabled={isAnalyzing}
                className="h-14 w-14 rounded-2xl p-0 shadow-md hover:shadow-lg transition-all border-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </Button>
            </div>
          </>
        ) : (
          <Button 
            onClick={stopCamera} 
            variant="destructive" 
            className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <CameraOff className="mr-2 h-5 w-5" />
            Stop Camera
          </Button>
        )}
      </div>
      
      {/* Contextual Tips - Only show when camera active */}
      {isStreaming && !result && (
        <div className="text-center text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-2">
          <p>Hold your device steady • Ensure good lighting • Tap capture when ready</p>
        </div>
      )}
    </div>
  );
};
