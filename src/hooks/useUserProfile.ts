import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, caregiver_id, patient_id')
        .eq('id', user.id)
        .single();
      
      // If user is a caregiver, fetch patient's profile for display
      let patientName: string | null = null;
      let patientId: string | null = null;
      
      if (profile?.patient_id) {
        const { data: patientProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', profile.patient_id)
          .single();
        
        patientName = patientProfile?.full_name || 'Patient';
        patientId = profile.patient_id;
      }
      
      return {
        user,
        profile,
        displayName: profile?.full_name?.split(' ')[0] 
          || user.user_metadata?.full_name?.split(' ')[0] 
          || 'there',
        isCaregiver: !!profile?.patient_id,
        isPatient: !profile?.patient_id,
        patientName,
        patientId,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (user data changes rarely)
  });
};
