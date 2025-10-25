import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Medication, Schedule, MedicationLog } from '@/hooks/useMedications';
import {
  getTimeBasedGradient,
  getGreetingEmoji,
} from '@/lib/dashboardHelpers';
import { getGreeting } from '@/lib/medicationHelpers';

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
  const gradient = getTimeBasedGradient(currentTime);
  const emoji = getGreetingEmoji(currentTime);
  const greeting = getGreeting(user?.email?.split('@')[0] || null, currentTime);
  const userInitial = user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} border border-border/50 backdrop-blur-sm animate-fade-in`}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
      
      <div className="relative p-8 md:p-12">
        {/* Minimal Greeting Section */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
              {greeting} {emoji}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};
