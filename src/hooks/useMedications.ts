import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthProvider';

export interface Medication {
  id: string;
  user_id: string;
  created_at: string;
  name: string;
  dosage: string;
  instructions: string | null;
  pill_image_url: string | null;
}

export interface Schedule {
  id: string;
  medication_id: string;
  user_id: string;
  time_to_take: string;
  days_of_week: string[];
}

export interface MedicationLog {
  id: string;
  schedule_id: string;
  user_id: string;
  taken_at: string;
  status: 'taken' | 'skipped' | 'missed';
}

export const useMedications = (targetUserId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Use targetUserId if provided, otherwise use current user's ID
  const userId = targetUserId || user?.id;

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ['medications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Medication[];
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: false, // Don't poll
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data as Schedule[];
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: false,
  });

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['medication-logs', userId, new Date().toDateString()],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('taken_at', today.toISOString())
        .eq('status', 'taken');
      
      if (error) throw error;
      return data as MedicationLog[];
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute (fresher data)
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const addMedication = useMutation({
    mutationFn: async (medication: Omit<Medication, 'id' | 'created_at' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('medications')
        .insert({ ...medication, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Only invalidate medications list for this user
      queryClient.invalidateQueries({ 
        queryKey: ['medications', user!.id] 
      });
    }
  });

  const addSchedule = useMutation({
    mutationFn: async (schedule: Omit<Schedule, 'id' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('schedules')
        .insert({ ...schedule, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Only invalidate schedules for this user
      queryClient.invalidateQueries({ 
        queryKey: ['schedules', user!.id] 
      });
    }
  });

  const logMedication = useMutation({
    mutationFn: async (log: Omit<MedicationLog, 'id' | 'taken_at' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('medication_logs')
        .insert({ ...log, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    // Optimistic update for instant UI feedback
    onMutate: async (newLog) => {
      const today = new Date().toDateString();
      const queryKey = ['medication-logs', user!.id, today];
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot previous value
      const previousLogs = queryClient.getQueryData<MedicationLog[]>(queryKey);
      
      // Optimistically update cache
      queryClient.setQueryData<MedicationLog[]>(queryKey, (old = []) => [
        ...old,
        {
          id: 'temp-' + Date.now(),
          ...newLog,
          user_id: user!.id,
          taken_at: new Date().toISOString(),
        } as MedicationLog,
      ]);
      
      return { previousLogs };
    },
    // Rollback on error
    onError: (err, newLog, context) => {
      const today = new Date().toDateString();
      queryClient.setQueryData(
        ['medication-logs', user!.id, today],
        context?.previousLogs
      );
    },
    // Invalidate on success to get real server data
    onSuccess: () => {
      const today = new Date().toDateString();
      
      // Only invalidate today's logs
      queryClient.invalidateQueries({ 
        queryKey: ['medication-logs', user!.id, today] 
      });
      
      // Invalidate history data (includes past logs)
      queryClient.invalidateQueries({ 
        queryKey: ['simple-history'] 
      });
    }
  });

  const deleteMedication = useMutation({
    mutationFn: async (medicationId: string) => {
      // First delete related schedules
      const { error: scheduleError } = await supabase
        .from('schedules')
        .delete()
        .eq('medication_id', medicationId);
      
      if (scheduleError) throw scheduleError;

      // Then delete the medication
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', medicationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['medications', user!.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['schedules', user!.id] 
      });
      // Invalidate history since it depends on medications
      queryClient.invalidateQueries({ 
        queryKey: ['simple-history'] 
      });
    }
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ scheduleId, updates }: { scheduleId: string; updates: Partial<Schedule> }) => {
      const { data, error } = await supabase
        .from('schedules')
        .update(updates)
        .eq('id', scheduleId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Only invalidate schedules, not medications
      queryClient.invalidateQueries({ 
        queryKey: ['schedules', user!.id] 
      });
      
      // Invalidate today's logs (schedule change affects what's due)
      const today = new Date().toDateString();
      queryClient.invalidateQueries({ 
        queryKey: ['medication-logs', user!.id, today] 
      });
    }
  });

  const deleteSchedule = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['schedules', user!.id] 
      });
    }
  });

  return {
    medications,
    schedules,
    todayLogs,
    isLoading,
    addMedication,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    logMedication,
    deleteMedication
  };
};