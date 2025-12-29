import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BUCKET_NAME = 'organization-assets';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];
const ALLOWED_FAVICON_TYPES = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'];

export function useOrganizationAssets() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAsset = async (
    file: File,
    type: 'logo' | 'favicon',
    oldUrl?: string | null
  ): Promise<string | null> => {
    const allowedTypes = type === 'logo' ? ALLOWED_LOGO_TYPES : ALLOWED_FAVICON_TYPES;
    
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`);
      return null;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Le fichier ne doit pas dépasser 5 Mo');
      return null;
    }

    setIsUploading(true);

    try {
      // Delete old file if exists
      if (oldUrl) {
        const oldPath = extractPathFromUrl(oldUrl);
        if (oldPath) {
          await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
        }
      }

      // Generate unique filename
      const ext = file.name.split('.').pop();
      const filename = `${type}_${Date.now()}.${ext}`;
      const filePath = `${type}/${filename}`;

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} uploadé avec succès`);
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Erreur lors de l'upload du ${type === 'logo' ? 'logo' : 'favicon'}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteAsset = async (url: string): Promise<boolean> => {
    try {
      const path = extractPathFromUrl(url);
      if (!path) return false;

      const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  };

  return {
    uploadAsset,
    deleteAsset,
    isUploading,
  };
}

function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/organization-assets\/(.+)/);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}
