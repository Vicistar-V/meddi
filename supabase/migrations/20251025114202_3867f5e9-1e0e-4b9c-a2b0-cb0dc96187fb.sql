-- Create prescription uploads storage bucket
insert into storage.buckets (id, name, public)
values ('prescription_uploads', 'prescription_uploads', false);

-- RLS policies for prescription uploads
create policy "Users can upload their own prescriptions"
on storage.objects for insert
with check (
  bucket_id = 'prescription_uploads' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view their own prescriptions"
on storage.objects for select
using (
  bucket_id = 'prescription_uploads' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own prescriptions"
on storage.objects for delete
using (
  bucket_id = 'prescription_uploads' 
  and auth.uid()::text = (storage.foldername(name))[1]
);