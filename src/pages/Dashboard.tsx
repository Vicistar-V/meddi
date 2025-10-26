import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/BottomNav';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { QuickStatsHeader } from '@/components/dashboard/QuickStatsHeader';
import { CurrentDoseFocus } from '@/components/dashboard/CurrentDoseFocus';
import { CompactTimeline } from '@/components/dashboard/CompactTimeline';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { DailyStatsCard } from '@/components/dashboard/DailyStatsCard';
import { useMedications } from '@/hooks/useMedications';
import { useUserProfile } from '@/hooks/useUserProfile';
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
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, startOfWeek, format, isSameDay } from 'date-fns';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { medications, schedules, todayLogs, logMedication } = useMedications();
  const { data: userProfile } = useUserProfile();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Prefetch history data for faster navigation
  useEffect(() => {
    if (userProfile?.user?.id) {
      queryClient.prefetchQuery({
        queryKey: ['simple-history', userProfile.user.id, 30],
        queryFn: async () => {
          const daysBack = 30;
          const endDate = endOfDay(new Date());
          const startDate = startOfDay(subDays(endDate, daysBack - 1));

          const { data: logs } = await supabase
            .from('medication_logs')
            .select('*, schedules(*, medications(*))')
            .eq('user_id', userProfile.user.id)
            .gte('taken_at', startDate.toISOString())
            .lte('taken_at', endDate.toISOString());

          const { data: schedules } = await supabase
            .from('schedules')
            .select('*, medications(*)')
            .eq('user_id', userProfile.user.id);

          return { logs, schedules };
        },
      });
    }
  }, [userProfile?.user?.id, queryClient]);

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

  const userName = userProfile?.displayName || 'there';

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
          <QuickStatsHeader
            userName={userName}
            todayProgress={0}
            weekStreak={0}
            weeklyAdherence={0}
          />
          
          <Card className="border-2 bg-gradient-butter shadow-honey p-12 text-center mt-6">
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
                  onClick={() => navigate('/medications/add')}
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
              <QuickActionsCard onAddMedication={() => navigate('/medications/add')} />
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
    </>
  );
};

export default Dashboard;