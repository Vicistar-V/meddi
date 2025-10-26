import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { AddMedicationFlow } from '@/components/AddMedicationFlow';
import { NextDoseCard } from '@/components/NextDoseCard';
import { DayTimeline } from '@/components/DayTimeline';
import { BottomNav } from '@/components/BottomNav';
import { HeroHeader } from '@/components/HeroHeader';
import { Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMedications } from '@/hooks/useMedications';
import { useAuth } from '@/context/AuthProvider';
import { getNextDose, getDosesByTimeOfDay, getDoseStatus } from '@/lib/medicationHelpers';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { medications, schedules, todayLogs } = useMedications();
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute for real-time missed status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const nextDose = getNextDose(medications, schedules, todayLogs, currentTime);
  const dosesTimeline = getDosesByTimeOfDay(medications, schedules, todayLogs, currentTime);

  // Calculate status for next dose
  const nextDoseStatus = nextDose 
    ? getDoseStatus(
        nextDose.time, 
        nextDose.schedules.map(s => s.schedule.id),
        todayLogs,
        currentTime
      )
    : null;

  const hasMedications = medications.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar onAddClick={() => setShowAddMedication(true)} />
      
      {/* Zone 1: The Action Center (Hero Section) */}
      <div className="container mx-auto px-4 pt-8 pb-6">
        {/* Modern Hero Header */}
        <HeroHeader
          user={user}
          medications={medications}
          schedules={schedules}
          todayLogs={todayLogs}
          currentTime={currentTime}
        />
        
        {hasMedications && nextDose && (
          <div className="mt-6">
            <NextDoseCard 
              nextDose={nextDose}
              status={nextDoseStatus}
              onDoseComplete={() => {
                // Refresh will happen automatically via query invalidation
              }}
            />
          </div>
        )}
        
        {!hasMedications && (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Welcome to Pill-Pal AI!</h3>
            <p className="mb-6 text-muted-foreground">
              Get started by adding your first medication
            </p>
            <Button size="lg" onClick={() => setShowAddMedication(true)}>
              Add Your First Medication
            </Button>
          </div>
        )}
      </div>
      
      {/* Zone 2: The Day's Plan (Timeline) */}
      {hasMedications && (
        <div className="container mx-auto px-4 pb-8">
          <h2 className="mb-4 text-lg font-semibold">Today's Plan</h2>
          <DayTimeline 
            dosesTimeline={dosesTimeline}
            todayLogs={todayLogs}
            currentTime={currentTime}
          />
        </div>
      )}
      
      {/* Zone 3: Floating Action Button */}
      <Button 
        className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-shadow z-40"
        size="icon"
        onClick={() => navigate('/verify')}
        aria-label="Identify Pill"
      >
        <Camera className="h-6 w-6" />
      </Button>
      
      {/* Bottom Navigation */}
      <BottomNav />
      
      {/* Modals */}
      <AddMedicationFlow 
        open={showAddMedication} 
        onOpenChange={setShowAddMedication} 
      />
    </div>
  );
}