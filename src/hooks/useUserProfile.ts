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
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      return {
        user,
        profile,
        displayName: profile?.full_name?.split(' ')[0] 
          || user.user_metadata?.full_name?.split(' ')[0] 
          || 'there',
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (user data changes rarely)
  });
};
