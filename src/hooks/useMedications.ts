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

export const useMedications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ['medications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Medication[];
    },
    enabled: !!user
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*');
      
      if (error) throw error;
      return data as Schedule[];
    },
    enabled: !!user
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
      queryClient.invalidateQueries({ queryKey: ['medications'] });
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
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
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
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    }
  });

  return {
    medications,
    schedules,
    isLoading,
    addMedication,
    addSchedule,
    logMedication,
    deleteMedication
  };
};