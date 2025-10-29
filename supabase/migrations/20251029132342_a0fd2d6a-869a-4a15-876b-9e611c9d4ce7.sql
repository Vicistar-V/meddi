-- Phase 1: Caregiver Connect Database Schema & Security (Updated)

-- 1.1 Add indexes for existing caregiver relationship columns
CREATE INDEX IF NOT EXISTS idx_profiles_caregiver_id ON public.profiles(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_profiles_patient_id ON public.profiles(patient_id);

-- 1.2 Create invitations table for secure connection handshake
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  invitation_code TEXT UNIQUE NOT NULL,
  created_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  accepted_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS on invitations table
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations table
CREATE POLICY "Users can view their own invitations"
ON public.invitations
FOR SELECT
USING (
  auth.uid() = created_by_user_id 
  OR 
  auth.uid() = accepted_by_user_id
);

CREATE POLICY "Users can insert their own invitations"
ON public.invitations
FOR INSERT
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Users can update their own invitations"
ON public.invitations
FOR UPDATE
USING (auth.uid() = created_by_user_id);

-- 1.3 Update RLS policies for data sharing on medications table
DROP POLICY IF EXISTS "Users can view their own medications" ON public.medications;
CREATE POLICY "Users can view own or patient medications"
ON public.medications
FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  auth.uid() = (SELECT caregiver_id FROM public.profiles WHERE id = user_id)
);

-- 1.4 Update RLS policies for schedules table
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.schedules;
CREATE POLICY "Users can view own or patient schedules"
ON public.schedules
FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  auth.uid() = (SELECT caregiver_id FROM public.profiles WHERE id = user_id)
);

-- 1.5 Update RLS policies for medication_logs table
DROP POLICY IF EXISTS "Users can view their own logs" ON public.medication_logs;
CREATE POLICY "Users can view own or patient logs"
ON public.medication_logs
FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  auth.uid() = (SELECT caregiver_id FROM public.profiles WHERE id = user_id)
);

-- 1.6 Update profiles SELECT policy to allow caregivers to view patient profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view own or related profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR 
  auth.uid() = caregiver_id 
  OR 
  auth.uid() = patient_id
);