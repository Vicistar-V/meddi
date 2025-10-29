import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCaregiverConnect } from '@/hooks/useCaregiverConnect';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check, UserPlus, Users, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const CaregiverConnectCard = () => {
  const { data: userProfile } = useUserProfile();
  const { generateCode, acceptCode, disconnectCaregiver, isGenerating, isAccepting, isDisconnecting } = useCaregiverConnect();
  const { toast } = useToast();
  
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [caregiverName, setCaregiverName] = useState<string | null>(null);

  const isCaregiver = userProfile?.isCaregiver;
  const isPatient = userProfile?.isPatient;
  const hasCaregiver = !!userProfile?.profile?.caregiver_id;

  // Fetch active invitation code if patient
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!isPatient || hasCaregiver) return;

      const { data } = await supabase
        .from('invitations')
        .select('invitation_code, expires_at')
        .eq('created_by_user_id', userProfile?.user?.id)
        .eq('is_active', true)
        .single();

      if (data && new Date(data.expires_at) > new Date()) {
        setInvitationCode(data.invitation_code);
      }
    };

    fetchInvitation();
  }, [isPatient, hasCaregiver, userProfile]);

  // Fetch caregiver name if patient has caregiver
  useEffect(() => {
    const fetchCaregiverName = async () => {
      if (!hasCaregiver || !userProfile?.profile?.caregiver_id) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userProfile.profile.caregiver_id)
        .single();

      setCaregiverName(data?.full_name || 'Your caregiver');
    };

    fetchCaregiverName();
  }, [hasCaregiver, userProfile]);

  const handleGenerateCode = async () => {
    generateCode(undefined, {
      onSuccess: (data: { code: string }) => {
        setInvitationCode(data.code);
      },
    });
  };

  const handleCopyCode = async () => {
    if (!invitationCode) return;
    
    await navigator.clipboard.writeText(invitationCode);
    setCopied(true);
    toast({
      title: 'Code copied',
      description: 'Invitation code copied to clipboard',
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAcceptCode = () => {
    if (inputCode.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a 6-character invitation code',
        variant: 'destructive',
      });
      return;
    }
    
    acceptCode(inputCode, {
      onSuccess: () => {
        setInputCode('');
      },
    });
  };

  const handleDisconnect = () => {
    disconnectCaregiver(undefined, {
      onSuccess: () => {
        setInvitationCode(null);
        setCaregiverName(null);
        setShowDisconnectDialog(false);
      },
    });
  };

  // For caregivers (viewing patient's data)
  if (isCaregiver) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Caring For
          </CardTitle>
          <CardDescription>You have read-only access to their medication schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-semibold text-lg">{userProfile?.patientName}</p>
              <Badge variant="secondary" className="mt-1">Connected</Badge>
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You can view {userProfile?.patientName}'s medication schedule, but only they can mark doses as taken.
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => setShowDisconnectDialog(true)}
            disabled={isDisconnecting}
            variant="destructive"
            className="w-full"
          >
            {isDisconnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Stop Monitoring'
            )}
          </Button>

          <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Stop monitoring?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will no longer be able to view {userProfile?.patientName}'s medication schedule. They can invite you again if needed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect}>Disconnect</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    );
  }

  // For patients with a caregiver
  if (hasCaregiver) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Caregiver Access
          </CardTitle>
          <CardDescription>Someone you trust can view your medication schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-semibold text-lg">{caregiverName}</p>
              <Badge variant="secondary" className="mt-1">Connected</Badge>
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {caregiverName} can view your medication schedule, but cannot make any changes.
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => setShowDisconnectDialog(true)}
            disabled={isDisconnecting}
            variant="destructive"
            className="w-full"
          >
            {isDisconnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect Caregiver'
            )}
          </Button>

          <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect caregiver?</AlertDialogTitle>
                <AlertDialogDescription>
                  {caregiverName} will no longer be able to view your medication schedule. You can invite them again later if needed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect}>Disconnect</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    );
  }

  // For patients with invitation code generated
  if (invitationCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invitation Code
          </CardTitle>
          <CardDescription>Share this code with your caregiver to connect</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center p-6 bg-primary/10 rounded-lg">
            <span className="text-3xl font-bold tracking-widest">{invitationCode}</span>
          </div>

          <Button
            onClick={handleCopyCode}
            variant="outline"
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Code
              </>
            )}
          </Button>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This code expires in 7 days. Your caregiver will have read-only access to your medication schedule.
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => setShowDisconnectDialog(true)}
            variant="ghost"
            className="w-full"
          >
            Revoke Invitation
          </Button>

          <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This code will no longer work. You can generate a new code at any time.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect}>Revoke</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    );
  }

  // For unconnected users (both patients and potential caregivers)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Caregiver Connect
        </CardTitle>
        <CardDescription>Share or monitor medication schedules with a trusted person</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Share with a Caregiver Section */}
        <div className="space-y-3">
          <h3 className="font-semibold">Share with a Caregiver</h3>
          <p className="text-sm text-muted-foreground">
            Give a trusted person view-only access to your medication schedule
          </p>
          <Button
            onClick={handleGenerateCode}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Generate Invitation Code
              </>
            )}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Connect to a Loved One Section */}
        <div className="space-y-3">
          <h3 className="font-semibold">Connect to a Loved One</h3>
          <p className="text-sm text-muted-foreground">
            Enter the invitation code they shared with you
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter 6-digit code"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="uppercase text-center tracking-widest text-lg"
            />
            <Button
              onClick={handleAcceptCode}
              disabled={isAccepting || inputCode.length !== 6}
            >
              {isAccepting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
