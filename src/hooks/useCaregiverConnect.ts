import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useCaregiverConnect = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generateCode = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-invite-code', {
        method: 'POST',
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Invitation code generated',
        description: 'Share this code with your caregiver to connect',
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to generate code',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const acceptCode = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.functions.invoke('accept-invite-code', {
        method: 'POST',
        body: { code: code.toUpperCase() },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Successfully connected',
        description: `You can now view ${data.patientName}'s medication schedule`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['medication-logs'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to connect',
        description: error.message || 'Please check the code and try again',
        variant: 'destructive',
      });
    },
  });

  const disconnectCaregiver = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('disconnect-caregiver', {
        method: 'POST',
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Disconnected',
        description: 'Caregiver connection has been removed',
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['medication-logs'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to disconnect',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  return {
    generateCode: generateCode.mutate,
    acceptCode: acceptCode.mutate,
    disconnectCaregiver: disconnectCaregiver.mutate,
    isGenerating: generateCode.isPending,
    isAccepting: acceptCode.isPending,
    isDisconnecting: disconnectCaregiver.isPending,
  };
};
