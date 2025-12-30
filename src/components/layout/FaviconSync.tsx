import { useEffect } from 'react';
import { usePublicBranding } from '@/hooks/usePublicBranding';

/**
 * Component to synchronize the browser favicon with the organization's favicon_url
 * Should be rendered at the app root level.
 * Uses public branding RPC which is accessible without authentication.
 */
export function FaviconSync() {
  const { data: branding } = usePublicBranding();

  useEffect(() => {
    const faviconUrl = branding?.favicon_url;
    if (!faviconUrl) return;

    // Update or create favicon link
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    
    link.href = faviconUrl;
  }, [branding?.favicon_url]);

  return null;
}
