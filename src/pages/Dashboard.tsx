import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { AddMedicationFlow } from '@/components/AddMedicationFlow';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { QuickStatsHeader } from '@/components/dashboard/QuickStatsHeader';
import { CurrentDoseFocus } from '@/components/dashboard/CurrentDoseFocus';
import { CompactTimeline } from '@/components/dashboard/CompactTimeline';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { DailyStatsCard } from '@/components/dashboard/DailyStatsCard';
import { useMedications } from '@/hooks/useMedications';
import { useAuth } from '@/context/AuthProvider';
import { getNextDose, getDosesByTimeOfDay, getDoseStatus } from '@/lib/medicationHelpers';
import { 
  calculateDailyProgress, 
  getDailyStats, 
  calculateWeeklyAdherence, 
  calculateStreak,
  getOnTimePercentage 
} from '@/lib/dashboardStats';
import { useToast } from '@/hooks/use-toast';
import { DoseGroup } from '@/lib/medicationHelpers';

const Dashboard = () => {
  const [showAddFlow, setShowAddFlow] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();

  const { medications, schedules, todayLogs, logMedication } = useMedications();
  const { user } = useAuth();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate data
  const nextDose = getNextDose(medications, schedules, todayLogs, currentTime);
  const dosesTimeline = getDosesByTimeOfDay(medications, schedules, todayLogs, currentTime);
  
  // Calculate next dose status
  const calculateNextDoseStatus = (): 'overdue' | 'current' | 'upcoming' | 'complete' => {
    if (!nextDose) return 'complete';
    
    const status = getDoseStatus(
      nextDose.time,
      nextDose.schedules.map(s => s.schedule.id),
      todayLogs,
      currentTime
    );
    
    // Map DoseStatus to CurrentDoseFocus status
    if (status === 'completed') return 'complete';
    if (status === 'missed') return 'overdue';
    return status; // 'current' or 'upcoming'
  };
  
  const nextDoseStatus = calculateNextDoseStatus();
  
  const dailyProgress = calculateDailyProgress(schedules, todayLogs);
  const dailyStats = getDailyStats(schedules, todayLogs);
  const weeklyAdherence = calculateWeeklyAdherence(schedules, todayLogs);
  const streak = calculateStreak(todayLogs);
  
  const allDoses = Array.from(dosesTimeline.values()).flat();
  const onTimePercentage = getOnTimePercentage(allDoses, todayLogs, currentTime);

  // Get user name
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  // Handle marking dose as taken
  const handleMarkTaken = async (dose: DoseGroup) => {
    try {
      await Promise.all(
        dose.schedules.map(item =>
          logMedication.mutateAsync({
            schedule_id: item.schedule.id,
            status: 'taken',
          })
        )
      );
      toast({
        title: 'Dose logged',
        description: 'Successfully logged medication intake'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log dose. Please try again.'
      });
    }
  };

  // Handle marking individual medication as taken
  const handleMarkIndividual = async (scheduleId: string, medicationName: string) => {
    try {
      await logMedication.mutateAsync({
        schedule_id: scheduleId,
        status: 'taken',
      });
      toast({
        title: 'Medication logged',
        description: `${medicationName} marked as taken`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log medication. Please try again.'
      });
    }
  };

  const handleSkip = (dose: DoseGroup) => {
    toast({
      title: 'Dose skipped',
      description: 'You can log it later if needed'
    });
  };

  // Empty state
  if (medications.length === 0) {
    return (
      <>
        <AppHeader />
        <main className="container mx-auto px-4 py-6 pb-32">
          <Card className="border-2 bg-gradient-butter shadow-honey p-12 text-center">
            <div className="mx-auto max-w-sm space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Plus className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  No medications configured
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Add your first medication to start tracking your doses
                </p>
                <Button
                  onClick={() => setShowAddFlow(true)}
                  size="lg"
                  className="w-full max-w-xs"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Your First Medication
                </Button>
              </div>
            </div>
          </Card>
        </main>
        <BottomNav />
        <AddMedicationFlow 
          open={showAddFlow} 
          onOpenChange={setShowAddFlow} 
        />
      </>
    );
  }

  return (
    <>
      <AppHeader />
      
      <main>
        <DashboardLayout
          header={
            <QuickStatsHeader
              userName={userName}
              todayProgress={dailyProgress}
              weekStreak={streak}
              weeklyAdherence={weeklyAdherence}
            />
          }
          mainContent={
            <>
              <CurrentDoseFocus
                nextDose={nextDose}
                status={nextDoseStatus}
                currentTime={currentTime}
                onMarkTaken={handleMarkTaken}
                onMarkIndividual={handleMarkIndividual}
                onSkip={handleSkip}
                todayLogs={todayLogs}
              />

              <CompactTimeline
                dosesTimeline={dosesTimeline}
                todayLogs={todayLogs}
                currentTime={currentTime}
                onMarkTaken={handleMarkTaken}
                onMarkIndividual={handleMarkIndividual}
              />
            </>
          }
          sidebar={
            <>
              <QuickActionsCard onAddMedication={() => setShowAddFlow(true)} />
              <DailyStatsCard
                adherence={dailyProgress}
                completedCount={dailyStats.completed}
                totalCount={dailyStats.total}
                onTimePercentage={onTimePercentage}
                streak={streak}
              />
            </>
          }
        />
      </main>

      {/* Mobile FAB for camera - visible only on mobile */}
      <button
        onClick={() => navigate('/verify')}
        className="fixed bottom-32 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 active:scale-95 lg:hidden"
        aria-label="Scan prescription"
      >
        <Camera className="h-6 w-6" />
      </button>

      <BottomNav />
      
      <AddMedicationFlow 
        open={showAddFlow} 
        onOpenChange={setShowAddFlow} 
      />
    </>
  );
};

export default Dashboard;