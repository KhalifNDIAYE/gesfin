import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PAGES_TO_TEST, PageTestConfig, REGRESSION_THRESHOLDS } from '@/tests/layout/layoutTestConfig';

export interface LayoutValidationResult {
  isValid: boolean;
  pagePath: string;
  pageName: string;
  checks: {
    hasAppLayout: boolean;
    hasHeader: boolean;
    hasSidebar: boolean;
    hasMainContent: boolean;
  };
  errors: LayoutRegressionError[];
  timestamp: Date;
}

export interface LayoutRegressionError {
  type: 'layout_missing' | 'header_missing' | 'sidebar_missing' | 'content_empty';
  severity: 'critical' | 'warning';
  message: string;
  pagePath: string;
  pageName: string;
}

// Stockage local des résultats de validation pour historique
const VALIDATION_STORAGE_KEY = 'layout_validation_history';

export function useLayoutValidation() {
  const location = useLocation();
  const [lastValidation, setLastValidation] = useState<LayoutValidationResult | null>(null);
  const [regressionErrors, setRegressionErrors] = useState<LayoutRegressionError[]>([]);

  // Récupérer la config de la page actuelle
  const getCurrentPageConfig = useCallback((): PageTestConfig | undefined => {
    return PAGES_TO_TEST.find(page => page.path === location.pathname);
  }, [location.pathname]);

  // Valider la structure du layout
  const validateLayout = useCallback((): LayoutValidationResult => {
    const pageConfig = getCurrentPageConfig();
    const errors: LayoutRegressionError[] = [];

    // Sélecteurs pour détecter les composants du layout
    const hasAppLayout = !!document.querySelector('[data-layout="app"]') || 
                         !!document.querySelector('.pl-64') || // Classe typique d'AppLayout
                         !!document.querySelector('aside'); // Sidebar présente
    
    const hasHeader = !!document.querySelector('header') ||
                      !!document.querySelector('[data-component="header"]');
    
    const hasSidebar = !!document.querySelector('aside') ||
                       !!document.querySelector('[data-component="sidebar"]') ||
                       !!document.querySelector('nav[class*="sidebar"]');
    
    const hasMainContent = !!document.querySelector('main') ||
                           !!document.querySelector('[data-component="main-content"]');

    const pageName = pageConfig?.name || location.pathname;
    const expectedChecks = pageConfig?.layoutChecks || {
      hasAppLayout: true,
      hasHeader: true,
      hasSidebar: true,
      hasMainContent: true,
    };

    // Générer les erreurs de régression
    if (expectedChecks.hasAppLayout && !hasAppLayout) {
      errors.push({
        type: 'layout_missing',
        severity: REGRESSION_THRESHOLDS.layoutMissing as 'critical',
        message: `AppLayout manquant sur la page "${pageName}"`,
        pagePath: location.pathname,
        pageName,
      });
    }

    if (expectedChecks.hasHeader && !hasHeader) {
      errors.push({
        type: 'header_missing',
        severity: REGRESSION_THRESHOLDS.headerMissing as 'critical',
        message: `Header manquant sur la page "${pageName}"`,
        pagePath: location.pathname,
        pageName,
      });
    }

    if (expectedChecks.hasSidebar && !hasSidebar) {
      errors.push({
        type: 'sidebar_missing',
        severity: REGRESSION_THRESHOLDS.sidebarMissing as 'critical',
        message: `Sidebar manquante sur la page "${pageName}"`,
        pagePath: location.pathname,
        pageName,
      });
    }

    if (expectedChecks.hasMainContent && !hasMainContent) {
      errors.push({
        type: 'content_empty',
        severity: REGRESSION_THRESHOLDS.contentEmpty as 'warning',
        message: `Zone de contenu principale manquante sur la page "${pageName}"`,
        pagePath: location.pathname,
        pageName,
      });
    }

    const result: LayoutValidationResult = {
      isValid: errors.length === 0,
      pagePath: location.pathname,
      pageName,
      checks: {
        hasAppLayout,
        hasHeader,
        hasSidebar,
        hasMainContent,
      },
      errors,
      timestamp: new Date(),
    };

    return result;
  }, [location.pathname, getCurrentPageConfig]);

  // Sauvegarder le résultat dans l'historique
  const saveValidationResult = useCallback((result: LayoutValidationResult) => {
    try {
      const historyStr = localStorage.getItem(VALIDATION_STORAGE_KEY);
      const history: LayoutValidationResult[] = historyStr ? JSON.parse(historyStr) : [];
      
      // Garder seulement les 100 derniers résultats
      history.unshift(result);
      if (history.length > 100) {
        history.splice(100);
      }
      
      localStorage.setItem(VALIDATION_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save layout validation result:', e);
    }
  }, []);

  // Exécuter la validation après le rendu
  useEffect(() => {
    // Attendre que le DOM soit rendu
    const timeoutId = setTimeout(() => {
      const result = validateLayout();
      setLastValidation(result);
      setRegressionErrors(result.errors);
      saveValidationResult(result);

      // Afficher les erreurs critiques en console en mode dev
      if (import.meta.env.DEV && result.errors.length > 0) {
        const criticalErrors = result.errors.filter(e => e.severity === 'critical');
        if (criticalErrors.length > 0) {
          console.group('🚨 RÉGRESSION VISUELLE DÉTECTÉE');
          criticalErrors.forEach(error => {
            console.error(`[${error.severity.toUpperCase()}] ${error.message}`);
          });
          console.groupEnd();
        }
      }
    }, 500); // Délai pour laisser le temps au rendu

    return () => clearTimeout(timeoutId);
  }, [location.pathname, validateLayout, saveValidationResult]);

  // Obtenir l'historique des validations
  const getValidationHistory = useCallback((): LayoutValidationResult[] => {
    try {
      const historyStr = localStorage.getItem(VALIDATION_STORAGE_KEY);
      return historyStr ? JSON.parse(historyStr) : [];
    } catch (e) {
      return [];
    }
  }, []);

  // Obtenir les régressions non résolues
  const getUnresolvedRegressions = useCallback((): LayoutRegressionError[] => {
    const history = getValidationHistory();
    const latestByPage = new Map<string, LayoutValidationResult>();
    
    history.forEach(result => {
      if (!latestByPage.has(result.pagePath)) {
        latestByPage.set(result.pagePath, result);
      }
    });

    const allErrors: LayoutRegressionError[] = [];
    latestByPage.forEach(result => {
      allErrors.push(...result.errors);
    });

    return allErrors;
  }, [getValidationHistory]);

  // Effacer l'historique
  const clearHistory = useCallback(() => {
    localStorage.removeItem(VALIDATION_STORAGE_KEY);
  }, []);

  return {
    lastValidation,
    regressionErrors,
    validateLayout,
    getValidationHistory,
    getUnresolvedRegressions,
    clearHistory,
    currentPageConfig: getCurrentPageConfig(),
  };
}
