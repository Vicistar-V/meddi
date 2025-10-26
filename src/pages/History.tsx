import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useMedications } from '@/hooks/useMedications';
import { Calendar as CalendarIcon, TrendingUp, Award, CheckCircle2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

export default function History() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { medications, schedules, todayLogs } = useMedications();

  // Calculate adherence stats
  const calculateAdherence = () => {
    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // For demo purposes - in real app, fetch logs for entire month
    const totalExpected = daysInMonth.length * schedules.length;
    const totalTaken = todayLogs.length; // Simplified for demo
    const adherenceRate = totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 0;

    return {
      adherenceRate,
      streak: 7, // Demo value - calculate actual streak from logs
      monthTotal: totalTaken
    };
  };

  const stats = calculateAdherence();

  // Get logs for selected date
  const selectedDateLogs = selectedDate
    ? todayLogs.filter(log => {
        const logDate = new Date(log.taken_at);
        return isSameDay(logDate, selectedDate);
      })
    : [];

  // Get scheduled medications for selected date
  const selectedDateSchedules = selectedDate
    ? schedules.filter(schedule => {
        const dayOfWeek = selectedDate
          .toLocaleDateString('en-US', { weekday: 'short' })
          .toLowerCase();
        return schedule.days_of_week.includes(dayOfWeek);
      })
    : [];

  const selectedDateMedications = selectedDateSchedules.map(schedule => {
    const medication = medications.find(m => m.id === schedule.medication_id);
    const wasTaken = selectedDateLogs.some(log => log.schedule_id === schedule.id);

    return {
      schedule,
      medication,
      wasTaken
    };
  }).filter(item => item.medication);

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold">Medication History</h1>
          <p className="text-muted-foreground">
            Track your medication adherence over time
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="bg-gradient-warm-cream">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adherence Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.adherenceRate}%</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-warm-cream">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.streak} days</div>
              <p className="text-xs text-muted-foreground">Keep it up!</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-warm-cream">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doses Taken</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthTotal}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calendar */}
          <Card className="bg-gradient-latte">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  completed: (date) => {
                    // For demo - mark today and a few recent days as completed
                    const today = new Date();
                    const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                    return daysAgo >= 0 && daysAgo < 7;
                  }
                }}
                modifiersStyles={{
                  completed: {
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    color: 'hsl(var(--primary))',
                    fontWeight: 'bold'
                  }
                }}
              />
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary/10" />
                  <span>Medication logged</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Details */}
          <Card className="bg-gradient-warm-cream">
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateMedications.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateMedications.map(({ schedule, medication, wasTaken }) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{medication!.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {medication!.dosage} • {schedule.time_to_take}
                        </p>
                      </div>
                      <Badge variant={wasTaken ? 'default' : 'secondary'}>
                        {wasTaken ? 'Taken' : 'Scheduled'}
                      </Badge>
                    </div>
                  ))}
                  
                  {selectedDateMedications.length > 0 && (
                    <div className="mt-4 rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        {selectedDateMedications.filter(m => m.wasTaken).length} of{' '}
                        {selectedDateMedications.length} doses taken
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <CalendarIcon className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    No medications scheduled for this day
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
