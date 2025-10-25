import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function History() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold">Medication History</h1>
          <p className="text-muted-foreground">
            Track your medication adherence over time
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Coming Soon
            </CardTitle>
            <CardDescription>
              Calendar view and detailed medication logs will be available here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-12 text-center">
              <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                This feature is under development and will include:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>📅 Calendar view of all medication logs</li>
                <li>📊 Adherence statistics and streaks</li>
                <li>🎯 Monthly and weekly summaries</li>
                <li>📈 Progress tracking over time</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
