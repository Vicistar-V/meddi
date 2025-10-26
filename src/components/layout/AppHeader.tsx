import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileSheet } from './ProfileSheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppHeaderProps {
  onAddClick?: () => void;
}

export const AppHeader = ({ onAddClick }: AppHeaderProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Determine page title and actions based on route
  const getPageConfig = () => {
    const path = location.pathname;
    
    if (path === '/dashboard' || path === '/') {
      return {
        title: 'Dashboard',
        showProfile: true,
        showAdd: false,
      };
    }
    
    if (path === '/medications') {
      return {
        title: 'My Medications',
        showProfile: false,
        showAdd: true,
      };
    }
    
    if (path === '/history') {
      return {
        title: 'History',
        showProfile: true,
        showAdd: false,
      };
    }
    
    if (path === '/settings') {
      return {
        title: 'Settings',
        showProfile: false,
        showAdd: false,
      };
    }
    
    if (path === '/verify') {
      return {
        title: 'Verify Pills',
        showProfile: true,
        showAdd: false,
      };
    }
    
    return {
      title: 'Meddi',
      showProfile: true,
      showAdd: false,
    };
  };
  
  const config = getPageConfig();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Page Title */}
          <h1 className="text-lg font-semibold text-foreground">
            {config.title}
          </h1>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {config.showAdd && onAddClick && (
              <Button 
                onClick={onAddClick} 
                size={isMobile ? "sm" : "default"}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {!isMobile && <span>Add</span>}
              </Button>
            )}
            
            {config.showProfile && <ProfileSheet />}
          </div>
        </div>
      </div>
    </header>
  );
};
