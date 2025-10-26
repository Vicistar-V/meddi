import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { CameraView } from '@/components/CameraView';

export default function Verify() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <AppHeader />
      <div className="container mx-auto px-4 pt-8 pb-6 max-w-4xl">
        {/* Minimalist Hero Section */}
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Verify Pill
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
            AI-powered instant identification
          </p>
        </div>

        <CameraView />
      </div>
      <BottomNav />
    </div>
  );
}