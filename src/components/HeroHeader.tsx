import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Medication, Schedule, MedicationLog } from '@/hooks/useMedications';
import {
  calculateDailyProgress,
  getDailyStats,
  calculateWeeklyAdherence,
  getMotivationalMessage,
  getTimeBasedGradient,
  getGreetingEmoji,
  calculateStreak,
} from '@/lib/dashboardHelpers';
import { getGreeting } from '@/lib/medicationHelpers';
import { Flame, Activity, CheckCircle2, Clock } from 'lucide-react';

interface HeroHeaderProps {
  user: any;
  medications: Medication[];
  schedules: Schedule[];
  todayLogs: MedicationLog[];
  currentTime: Date;
}

export const HeroHeader = ({
  user,
  medications,
  schedules,
  todayLogs,
  currentTime,
}: HeroHeaderProps) => {
  const progress = calculateDailyProgress(schedules, todayLogs);
  const stats = getDailyStats(schedules, todayLogs);
  const weeklyAdherence = calculateWeeklyAdherence(schedules, todayLogs);
  const motivationalMsg = getMotivationalMessage(progress);
  const gradient = getTimeBasedGradient(currentTime);
  const emoji = getGreetingEmoji(currentTime);
  const streak = calculateStreak(todayLogs);
  const greeting = getGreeting(user?.email?.split('@')[0] || null, currentTime);
  const userInitial = user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} border border-border/50 backdrop-blur-sm animate-fade-in`}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
      
      <div className="relative p-6 md:p-8">
        {/* Top Section - Avatar & Greeting */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
              {greeting} {emoji}
            </h1>
            
            {streak > 0 && (
              <Badge variant="secondary" className="gap-1 animate-pulse">
                <Flame className="h-3 w-3 text-orange-500" />
                {streak} day streak!
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Ring Section */}
        {schedules.length > 0 && (
          <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
            <ProgressRing progress={progress} size={140} />
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 w-full">
              <Card className="p-4 bg-background/50 backdrop-blur border-border/50 hover:bg-background/70 transition-colors">
                <div className="flex flex-col items-center text-center">
                  <Activity className="h-5 w-5 text-primary mb-2" />
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </Card>
              
              <Card className="p-4 bg-background/50 backdrop-blur border-border/50 hover:bg-background/70 transition-colors">
                <div className="flex flex-col items-center text-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mb-2" />
                  <div className="text-2xl font-bold">{stats.completed}</div>
                  <div className="text-xs text-muted-foreground">Done</div>
                </div>
              </Card>
              
              <Card className="p-4 bg-background/50 backdrop-blur border-border/50 hover:bg-background/70 transition-colors">
                <div className="flex flex-col items-center text-center">
                  <Clock className="h-5 w-5 text-orange-500 mb-2" />
                  <div className="text-2xl font-bold">{stats.remaining}</div>
                  <div className="text-xs text-muted-foreground">Left</div>
                </div>
              </Card>
              
              <Card className="p-4 bg-background/50 backdrop-blur border-border/50 hover:bg-background/70 transition-colors">
                <div className="flex flex-col items-center text-center">
                  <Activity className="h-5 w-5 text-blue-500 mb-2" />
                  <div className="text-2xl font-bold">{weeklyAdherence}%</div>
                  <div className="text-xs text-muted-foreground">Week</div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Motivational Message */}
        {schedules.length > 0 && (
          <p className="text-center md:text-left text-muted-foreground italic">
            {motivationalMsg}
          </p>
        )}

        {/* Empty State Message */}
        {schedules.length === 0 && (
          <p className="text-center text-muted-foreground">
            Add your first medication to start tracking your health journey! ✨
          </p>
        )}
      </div>
    </div>
  );
};
