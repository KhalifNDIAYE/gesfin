// Help content organized by category, module and role
export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: 'module' | 'guide' | 'faq' | 'glossary';
  module?: string;
  roles?: ('admin' | 'user' | 'all')[];
  keywords: string[];
}

export const helpArticles: HelpArticle[] = [
  // ===== MODULES =====
  {
    id: 'dashboard',
    title: 'Tableau de bord',
    content: `Le tableau de bord offre une vue synthétique de votre activité :

**Indicateurs clés :**
- Budget total et consommation
- Nombre de projets actifs
- Conventions en cours
- Alertes et notifications

**Vues disponibles :**
- Vue Direction : synthèse globale pour les décideurs
- Vue Finance : focus sur les aspects financiers
- Vue Projet : suivi opérationnel des projets

**Actions rapides :**
- Accédez aux projets nécessitant attention
- Consultez les dernières transactions
- Visualisez la répartition par bailleur`,
    category: 'module',
    module: 'Tableau de bord',
    roles: ['all'],
    keywords: ['dashboard', 'accueil', 'indicateurs', 'kpi', 'synthèse']
  },
  {
    id: 'projects',
    title: 'Gestion des Projets',
    content: `Le module Projets permet de gérer l'ensemble de vos projets de développement.

**Fonctionnalités :**
- Création et modification de projets
- Suivi du statut (En attente, Actif, Suspendu, Clôturé)
- Affectation de responsables et sites
- Gestion des documents associés

**Vue carte géographique :**
- Visualisez vos projets sur une carte interactive
- Filtrez par statut, région ou bailleur
- Accédez aux détails en cliquant sur un marqueur

**Historique :**
- Toutes les modifications sont tracées
- Consultez l'onglet Historique pour voir les changements`,
    category: 'module',
    module: 'Projets',
    roles: ['all'],
    keywords: ['projet', 'project', 'création', 'suivi', 'carte', 'géolocalisation']
  },
  {
    id: 'conventions',
    title: 'Gestion des Conventions',
    content: `Les conventions représentent les accords de financement avec vos bailleurs.

**Informations clés :**
- Numéro et intitulé de la convention
- Bailleur associé
- Montant et devise
- Dates de validité

**Suivi financier :**
- Montant initial vs montant décaissé
- Taux de consommation
- Demandes de réapprovisionnement

**Documents :**
- Joignez les contrats signés
- Annexes et avenants
- Rapports financiers`,
    category: 'module',
    module: 'Conventions',
    roles: ['all'],
    keywords: ['convention', 'financement', 'bailleur', 'accord', 'contrat']
  },
  {
    id: 'marches',
    title: 'Gestion des Marchés',
    content: `Le module Marchés permet de gérer vos contrats avec les fournisseurs.

**Types de marchés :**
- Travaux
- Fournitures
- Services
- Prestations intellectuelles

**Cycle de vie :**
- Création du marché
- Engagements et décomptes
- Paiements
- Garanties (retenue, bonne exécution)

**Documents :**
- Contrat et annexes
- PV de réception
- Factures`,
    category: 'module',
    module: 'Marchés',
    roles: ['all'],
    keywords: ['marché', 'contrat', 'fournisseur', 'paiement', 'engagement']
  },
  {
    id: 'budget',
    title: 'Gestion Budgétaire',
    content: `Le module Budget permet un suivi rigoureux de vos ressources financières.

**Structure budgétaire :**
- Budgets par projet et convention
- Lignes budgétaires détaillées
- Catégories de dépenses

**Contrôles :**
- Alertes de dépassement (70%, 90%, 100%)
- Blocage des opérations si seuil atteint
- Transferts entre lignes budgétaires

**Workflow de validation :**
- Soumission → Validation → Approbation
- Historique des validations`,
    category: 'module',
    module: 'Budgets',
    roles: ['all'],
    keywords: ['budget', 'ligne', 'dépense', 'alerte', 'transfert', 'validation']
  },
  {
    id: 'comptabilite',
    title: 'Comptabilité',
    content: `Le module Comptabilité gère l'ensemble des écritures et opérations financières.

**Journaux :**
- Journal des achats
- Journal de banque
- Journal de caisse
- Journal des opérations diverses

**Fonctionnalités :**
- Saisie des écritures comptables
- Lettrage des comptes
- Rapprochement bancaire
- Gestion des tiers

**États financiers :**
- Balance générale
- Grand livre
- Compte de résultat
- Bilan`,
    category: 'module',
    module: 'Comptabilité',
    roles: ['all'],
    keywords: ['comptabilité', 'écriture', 'journal', 'balance', 'bilan', 'résultat']
  },
  {
    id: 'immobilisations',
    title: 'Immobilisations',
    content: `Gérez votre parc d'immobilisations et leur amortissement.

**Gestion des actifs :**
- Création et codification
- Affectation à un projet/convention
- Localisation et responsable

**Amortissements :**
- Calcul automatique (linéaire, dégressif)
- Génération des écritures
- Tableau d'amortissement

**Mouvements :**
- Transferts entre sites
- Mises au rebut
- Cessions`,
    category: 'module',
    module: 'Immobilisations',
    roles: ['all'],
    keywords: ['immobilisation', 'actif', 'amortissement', 'inventaire', 'cession']
  },
  {
    id: 'bailleurs',
    title: 'Gestion des Bailleurs',
    content: `Centralisez les informations sur vos partenaires financiers.

**Informations :**
- Nom et acronyme
- Type (bilatéral, multilatéral, ONG)
- Coordonnées et contacts

**Suivi :**
- Conventions associées
- Montants engagés
- Taux de décaissement`,
    category: 'module',
    module: 'Bailleurs',
    roles: ['all'],
    keywords: ['bailleur', 'donateur', 'partenaire', 'financement']
  },

  // ===== GUIDES RAPIDES =====
  {
    id: 'guide-create-project',
    title: 'Créer un nouveau projet',
    content: `**Étapes pour créer un projet :**

1. Allez dans **Projets** → **Liste des projets**
2. Cliquez sur le bouton **"Nouveau projet"**
3. Remplissez les informations obligatoires :
   - Code projet (généré automatiquement)
   - Intitulé du projet
   - Date de début
   - Responsable
   - Site d'exécution
4. Ajoutez une description (optionnel)
5. Cliquez sur **"Créer"**

**Après création :**
- Ajoutez les conventions de financement
- Définissez le budget
- Uploadez les documents nécessaires`,
    category: 'guide',
    roles: ['all'],
    keywords: ['créer', 'nouveau', 'projet', 'étapes', 'guide']
  },
  {
    id: 'guide-add-convention',
    title: 'Ajouter une convention',
    content: `**Étapes pour ajouter une convention :**

1. Allez dans **Conventions** → **Liste**
2. Cliquez sur **"Nouvelle convention"**
3. Sélectionnez le bailleur
4. Renseignez :
   - Numéro de convention
   - Intitulé
   - Montant et devise
   - Dates de début et fin
5. Associez les projets financés
6. Cliquez sur **"Créer"**

**Documents à joindre :**
- Contrat signé
- Annexe budgétaire
- Conditions particulières`,
    category: 'guide',
    roles: ['all'],
    keywords: ['convention', 'ajouter', 'créer', 'bailleur', 'financement']
  },
  {
    id: 'guide-record-expense',
    title: 'Enregistrer une dépense',
    content: `**Étapes pour enregistrer une dépense :**

1. Allez dans **Comptabilité** → **Dépenses**
2. Cliquez sur **"Nouvelle dépense"**
3. Sélectionnez :
   - Le projet concerné
   - La catégorie de dépense
   - La ligne budgétaire
4. Renseignez :
   - Montant
   - Date
   - Fournisseur/Bénéficiaire
   - Justificatif
5. Soumettez pour validation

**Workflow :**
- En attente → Validée → Payée
- Chaque étape peut nécessiter une approbation`,
    category: 'guide',
    roles: ['all'],
    keywords: ['dépense', 'enregistrer', 'paiement', 'facture', 'comptabilité']
  },
  {
    id: 'guide-generate-report',
    title: 'Générer un rapport',
    content: `**Types de rapports disponibles :**

- **Rapport financier (IFR)** : suivi des décaissements
- **Bilan** : situation patrimoniale
- **Compte de résultat** : produits et charges
- **Rapport SYSCOHADA** : conformité régionale

**Étapes :**

1. Allez dans **Rapports**
2. Sélectionnez le type de rapport
3. Choisissez la période
4. Filtrez par projet/convention si besoin
5. Cliquez sur **"Générer"**

**Export :**
- PDF pour impression
- Excel pour analyse`,
    category: 'guide',
    roles: ['all'],
    keywords: ['rapport', 'générer', 'export', 'pdf', 'excel', 'IFR', 'bilan']
  },
  {
    id: 'guide-manage-users',
    title: 'Gérer les utilisateurs',
    content: `**Réservé aux administrateurs**

**Créer un utilisateur :**
1. Allez dans **Administration** → **Utilisateurs**
2. Cliquez sur **"Nouvel utilisateur"**
3. Renseignez email et nom complet
4. Attribuez un ou plusieurs rôles
5. L'utilisateur recevra un email d'invitation

**Modifier les permissions :**
1. Allez dans **Administration** → **Rôles**
2. Sélectionnez le rôle à modifier
3. Cochez/décochez les permissions par module
4. Sauvegardez

**Rôles prédéfinis :**
- Admin : accès complet
- Chef de projet : gestion projets
- Comptable : opérations financières`,
    category: 'guide',
    roles: ['admin'],
    keywords: ['utilisateur', 'rôle', 'permission', 'admin', 'accès']
  },

  // ===== FAQ =====
  {
    id: 'faq-password-reset',
    title: 'Comment réinitialiser mon mot de passe ?',
    content: `**Sur la page de connexion :**

1. Cliquez sur **"Mot de passe oublié ?"**
2. Entrez votre adresse email
3. Consultez votre boîte de réception
4. Cliquez sur le lien de réinitialisation
5. Définissez un nouveau mot de passe

**Le lien est valide 24h.**

Si vous ne recevez pas l'email :
- Vérifiez vos spams
- Contactez votre administrateur`,
    category: 'faq',
    roles: ['all'],
    keywords: ['mot de passe', 'oublié', 'réinitialiser', 'connexion', 'email']
  },
  {
    id: 'faq-access-denied',
    title: 'Pourquoi ai-je un message "Accès refusé" ?',
    content: `Ce message apparaît quand vous n'avez pas les permissions nécessaires.

**Causes possibles :**
- Votre rôle ne permet pas cette action
- La ressource appartient à un autre projet
- Votre session a expiré

**Solutions :**
1. Reconnectez-vous
2. Vérifiez que vous êtes sur le bon projet
3. Contactez votre administrateur pour obtenir les droits nécessaires

**Pour les administrateurs :**
Vérifiez les permissions dans Administration → Rôles`,
    category: 'faq',
    roles: ['all'],
    keywords: ['accès', 'refusé', 'permission', 'erreur', 'droit']
  },
  {
    id: 'faq-budget-blocked',
    title: 'Pourquoi ma dépense est-elle bloquée ?',
    content: `Une dépense peut être bloquée pour plusieurs raisons :

**Budget insuffisant :**
- La ligne budgétaire a atteint son seuil d'alerte
- Le montant dépasse le disponible

**Workflow de validation :**
- La dépense attend une approbation
- Un valideur doit intervenir

**Solutions :**
1. Vérifiez le solde budgétaire
2. Demandez un transfert budgétaire
3. Contactez le valideur concerné

**Pour débloquer (Admin) :**
Administration → Actions bloquées`,
    category: 'faq',
    roles: ['all'],
    keywords: ['bloqué', 'dépense', 'budget', 'validation', 'insuffisant']
  },
  {
    id: 'faq-document-upload',
    title: 'Quels formats de documents sont acceptés ?',
    content: `**Formats supportés :**

- **Documents** : PDF, DOCX, DOC
- **Tableurs** : XLSX, XLS, CSV
- **Images** : JPG, PNG (pour justificatifs)

**Taille maximale :** 20 Mo par fichier

**Bonnes pratiques :**
- Nommez vos fichiers de manière explicite
- Privilégiez le PDF pour les documents officiels
- Compressez les images volumineuses

**En cas d'erreur :**
Vérifiez la taille et le format du fichier`,
    category: 'faq',
    roles: ['all'],
    keywords: ['document', 'upload', 'format', 'PDF', 'taille', 'fichier']
  },
  {
    id: 'faq-session-timeout',
    title: 'Pourquoi suis-je déconnecté automatiquement ?',
    content: `Pour des raisons de sécurité, votre session expire après une période d'inactivité.

**Durée par défaut :** 30 minutes

**Comportement :**
- Un avertissement s'affiche avant expiration
- Vous pouvez prolonger la session
- Les données non sauvegardées peuvent être perdues

**Conseil :**
Sauvegardez régulièrement votre travail, surtout pour les formulaires longs.`,
    category: 'faq',
    roles: ['all'],
    keywords: ['session', 'déconnexion', 'timeout', 'inactivité', 'expiration']
  },

  // ===== GLOSSAIRE =====
  {
    id: 'glossary-terms',
    title: 'Glossaire des termes',
    content: `**Bailleur :** Organisme qui finance un projet (Banque mondiale, AFD, UE, etc.)

**Convention :** Accord formel entre l'organisation et un bailleur définissant les termes du financement.

**Décaissement :** Sortie de fonds pour payer une dépense validée.

**Engagement :** Montant réservé pour une dépense future (marché signé mais non encore payé).

**IFR (Interim Financial Report) :** Rapport financier intermédiaire exigé par les bailleurs.

**Ligne budgétaire :** Subdivision du budget par catégorie de dépense.

**RLS (Row Level Security) :** Sécurité au niveau des lignes de données, limitant l'accès selon les permissions.

**SYSCOHADA :** Système comptable harmonisé utilisé en Afrique francophone.

**Workflow :** Processus de validation en plusieurs étapes.`,
    category: 'glossary',
    roles: ['all'],
    keywords: ['glossaire', 'définition', 'terme', 'vocabulaire']
  }
];

export const searchHelp = (query: string, userRole: 'admin' | 'user'): HelpArticle[] => {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) return [];
  
  return helpArticles.filter(article => {
    // Check role access
    const hasRoleAccess = article.roles?.includes('all') || 
                          article.roles?.includes(userRole);
    if (!hasRoleAccess) return false;
    
    // Search in title, content and keywords
    const matchesTitle = article.title.toLowerCase().includes(normalizedQuery);
    const matchesContent = article.content.toLowerCase().includes(normalizedQuery);
    const matchesKeywords = article.keywords.some(k => k.toLowerCase().includes(normalizedQuery));
    
    return matchesTitle || matchesContent || matchesKeywords;
  });
};

export const getArticlesByCategory = (
  category: 'module' | 'guide' | 'faq' | 'glossary',
  userRole: 'admin' | 'user'
): HelpArticle[] => {
  return helpArticles.filter(article => {
    const hasRoleAccess = article.roles?.includes('all') || 
                          article.roles?.includes(userRole);
    return article.category === category && hasRoleAccess;
  });
};
