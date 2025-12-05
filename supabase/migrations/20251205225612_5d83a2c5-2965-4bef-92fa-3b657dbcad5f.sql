-- Add attachment_url column to journal_entries for expense invoices
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Create storage bucket for expense attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-attachments', 'expense-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to expense-attachments bucket
CREATE POLICY "Users can upload expense attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expense-attachments');

-- Allow users to read their own attachments
CREATE POLICY "Users can view expense attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'expense-attachments');

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete expense attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'expense-attachments');