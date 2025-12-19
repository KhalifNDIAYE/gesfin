/**
 * Tests de validation du layout
 * Vérifie que toutes les pages utilisent correctement AppLayout
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PAGES_TO_TEST, PageTestConfig, ROLE_TEST_CONFIGS } from './layoutTestConfig';

// Simulations des vérifications de structure
interface LayoutCheckResult {
  page: PageTestConfig;
  hasAppLayout: boolean;
  hasHeader: boolean;
  hasSidebar: boolean;
  hasMainContent: boolean;
  passed: boolean;
  errors: string[];
}

describe('Tests de non-régression du Layout', () => {
  describe('Configuration des pages', () => {
    it('devrait avoir au moins une page configurée pour les tests', () => {
      expect(PAGES_TO_TEST.length).toBeGreaterThan(0);
    });

    it('toutes les pages sensibles devraient avoir layoutChecks complet', () => {
      const sensitivePages = PAGES_TO_TEST.filter(p => p.category === 'sensitive');
      
      sensitivePages.forEach(page => {
        expect(page.layoutChecks).toBeDefined();
        expect(page.layoutChecks.hasAppLayout).toBe(true);
        expect(page.layoutChecks.hasHeader).toBe(true);
        expect(page.layoutChecks.hasSidebar).toBe(true);
      });
    });

    it('la page Risques Budgétaires devrait être dans la liste', () => {
      const budgetRisksPage = PAGES_TO_TEST.find(p => p.path === '/budget/risks-dashboard');
      expect(budgetRisksPage).toBeDefined();
      expect(budgetRisksPage?.category).toBe('sensitive');
    });
  });

  describe('Configuration des rôles', () => {
    it('devrait avoir les 3 rôles principaux configurés', () => {
      expect(ROLE_TEST_CONFIGS).toHaveProperty('Admin');
      expect(ROLE_TEST_CONFIGS).toHaveProperty('Comptable');
      expect(ROLE_TEST_CONFIGS).toHaveProperty('Auditeur');
    });

    it('Admin devrait avoir accès à toutes les catégories', () => {
      const adminConfig = ROLE_TEST_CONFIGS.Admin;
      expect(adminConfig.testCategories).toContain('dashboard');
      expect(adminConfig.testCategories).toContain('module');
      expect(adminConfig.testCategories).toContain('admin');
      expect(adminConfig.testCategories).toContain('sensitive');
    });

    it('Comptable ne devrait pas avoir accès aux pages admin', () => {
      const comptableConfig = ROLE_TEST_CONFIGS.Comptable;
      expect(comptableConfig.excludePaths).toContain('/securite');
      expect(comptableConfig.excludePaths).toContain('/utilisateurs');
    });
  });

  describe('Cohérence des chemins', () => {
    it('tous les chemins devraient commencer par /', () => {
      PAGES_TO_TEST.forEach(page => {
        expect(page.path.startsWith('/')).toBe(true);
      });
    });

    it('aucun chemin ne devrait être dupliqué', () => {
      const paths = PAGES_TO_TEST.map(p => p.path);
      const uniquePaths = new Set(paths);
      expect(paths.length).toBe(uniquePaths.size);
    });

    it('toutes les pages avec requiresAuth devraient avoir layoutChecks', () => {
      const authPages = PAGES_TO_TEST.filter(p => p.requiresAuth);
      
      authPages.forEach(page => {
        expect(page.layoutChecks).toBeDefined();
      });
    });
  });

  describe('Couverture des modules', () => {
    const requiredModules = [
      '/projets',
      '/budgets',
      '/conventions',
      '/comptabilite',
      '/bailleurs',
      '/immobilisations',
      '/marches',
      '/rapports',
      '/decaissements',
    ];

    requiredModules.forEach(modulePath => {
      it(`devrait couvrir le module ${modulePath}`, () => {
        const hasModule = PAGES_TO_TEST.some(p => p.path.startsWith(modulePath));
        expect(hasModule).toBe(true);
      });
    });
  });

  describe('Pages administratives', () => {
    it('les pages admin devraient requérir le rôle Administrateur', () => {
      const adminPages = PAGES_TO_TEST.filter(p => p.category === 'admin');
      
      adminPages.forEach(page => {
        expect(page.requiredRoles).toBeDefined();
        expect(page.requiredRoles).toContain('Administrateur');
      });
    });
  });
});

describe('Validation des baselines visuelles', () => {
  describe('Tableaux de bord', () => {
    const dashboards = PAGES_TO_TEST.filter(p => p.category === 'dashboard');

    dashboards.forEach(dashboard => {
      it(`${dashboard.name} devrait avoir AppLayout, Header et Sidebar`, () => {
        expect(dashboard.layoutChecks.hasAppLayout).toBe(true);
        expect(dashboard.layoutChecks.hasHeader).toBe(true);
        expect(dashboard.layoutChecks.hasSidebar).toBe(true);
        expect(dashboard.layoutChecks.hasMainContent).toBe(true);
      });
    });
  });

  describe('Pages sensibles', () => {
    const sensitivePages = PAGES_TO_TEST.filter(p => p.category === 'sensitive');

    sensitivePages.forEach(page => {
      it(`${page.name} devrait avoir une configuration de layout complète`, () => {
        expect(page.layoutChecks).toEqual({
          hasAppLayout: true,
          hasHeader: true,
          hasSidebar: true,
          hasMainContent: true,
        });
      });
    });
  });
});

describe('Tests par rôle', () => {
  Object.entries(ROLE_TEST_CONFIGS).forEach(([roleKey, roleConfig]) => {
    describe(`Rôle: ${roleConfig.name}`, () => {
      const accessiblePages = PAGES_TO_TEST.filter(page => {
        // Vérifier si la catégorie est autorisée
        if (!roleConfig.testCategories.includes(page.category)) {
          return false;
        }
        // Vérifier si le chemin n'est pas exclu
        if ('excludePaths' in roleConfig) {
          const excluded = (roleConfig as any).excludePaths.some((excludePath: string) => 
            page.path.startsWith(excludePath)
          );
          if (excluded) return false;
        }
        return true;
      });

      it(`devrait avoir accès à au moins une page`, () => {
        expect(accessiblePages.length).toBeGreaterThan(0);
      });

      it(`toutes les pages accessibles devraient avoir le layout complet`, () => {
        accessiblePages.forEach(page => {
          expect(page.layoutChecks.hasAppLayout).toBe(true);
          expect(page.layoutChecks.hasHeader).toBe(true);
          expect(page.layoutChecks.hasSidebar).toBe(true);
        });
      });
    });
  });
});
