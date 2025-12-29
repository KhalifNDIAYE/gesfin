import { useEffect } from 'react';
import { useOrganizationSettings } from '@/hooks/useParametrage';

/**
 * Component to synchronize the browser favicon with the organization's favicon_url
 * Should be rendered at the app root level
 */
export function FaviconSync() {
  const { data: settings } = useOrganizationSettings();

  useEffect(() => {
    const faviconUrl = settings?.favicon_url;
    if (!faviconUrl) return;

    // Update or create favicon link
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    
    link.href = faviconUrl;
  }, [settings?.favicon_url]);

  return null;
}
