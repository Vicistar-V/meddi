import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CameraView } from '@/components/CameraView';
import { Camera } from 'lucide-react';

export default function Verify() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="h-6 w-6 text-primary" />
              <CardTitle>Pill Verification</CardTitle>
            </div>
            <CardDescription>
              Use your camera to identify and verify pills in real-time with AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CameraView />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}