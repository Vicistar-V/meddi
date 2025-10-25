import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera } from 'lucide-react';

export default function Verify() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="h-6 w-6 text-primary" />
              <CardTitle>Pill Verification</CardTitle>
            </div>
            <CardDescription>
              Use your camera to identify and verify pills in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Camera className="mx-auto h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg mb-2">Camera view will be implemented here</p>
              <p className="text-sm">This will use TensorFlow.js for real-time pill recognition</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}