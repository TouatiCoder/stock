# BuildStock Pro

Application complète de gestion de stocks et calculs structurels pour l'industrie de la construction.

## Fonctionnalités

### 1. Authentification Sécurisée
- **Login/Sign-up** : Authentification par email et mot de passe
- **Récupération de mot de passe** : Lien de réinitialisation sécurisé
- **Gestion des rôles** : Attribution des rôles par l'administrateur
- **Authentification biométrique** : Support Face ID/Empreinte (optionnel)

### 2. Gestion des Rôles et Permissions
Trois rôles avec permissions différentes :
- **Administrateur** : Accès complet, gestion d'équipe, paramètres entreprise
- **Chef de Chantier** : Gestion opérationnelle, saisie de stock, commandes
- **Ingénieur Structure** : Calculs techniques, projets, matériaux

### 3. Tableaux de Bord Personnalisés
- **Admin** : KPIs financiers, alertes budgets, synthèse inventaire
- **Chef de Chantier** : Stock actuel, seuils critiques, commandes en cours
- **Ingénieur** : Outils de calcul, bibliothèque de matériaux

### 4. Gestion de Stock/Inventaire
- Vue globale de l'inventaire avec valeur totale
- Liste complète des matériaux avec recherche et filtres
- Suivi des mouvements (entrées, sorties, retours)
- Alertes sur les seuils critiques
- Prévisions de stock

### 5. Calculs Structurels et Projets
- Gestion complète des projets (budget, dates, statut)
- Outils de calcul de charges (ELU/ELS)
- Bibliothèque de matériaux standardisés
- Suivi du budget vs dépenses réelles

### 6. Gestion des Coûts et Fournisseurs
- Tableau de bord financier avec KPIs
- Graphiques d'évolution des coûts
- Gestion des fournisseurs avec notations
- Gestion des commandes et factures
- Historique des prix et performance fournisseurs

### 7. Paramètres et Gestion d'Équipe
- **Profil personnel** : Modification des informations
- **Sécurité** : Changement de mot de passe, sessions actives
- **Paramètres entreprise** : Configuration devise, TVA, adresse
- **Gestion utilisateurs** : Invitation d'employés, attribution de rôles

## Structure du Projet

\`\`\`
app/
├── layout.tsx                 # Layout principal avec AuthProvider
├── page.tsx                   # Page d'accueil publique
├── login/                     # Pages d'authentification
├── signup/
├── forgot-password/
├── reset-password/
├── dashboard/                 # Dashboard personnalisé par rôle
├── inventory/                 # Gestion de stock
├── projects/                  # Calculs structurels
├── costs/                     # Gestion des coûts
└── settings/                  # Paramètres utilisateur

components/
├── auth/                      # Composants d'authentification
├── dashboards/               # Dashboards par rôle
├── inventory/                # Composants de gestion de stock
├── projects/                 # Composants de projets
├── costs/                    # Composants de gestion de coûts
├── settings/                 # Composants de paramètres
├── layout/                   # Sidebar, TopBar
└── ui/                       # Composants UI réutilisables

lib/
├── auth-context.tsx          # Contexte d'authentification
└── permissions.ts            # Gestion des permissions par rôle

hooks/
├── use-permissions.ts        # Hook pour vérifier les permissions
└── use-mobile.ts            # Hook pour responsive design
\`\`\`

## Getting Started

### Installation

\`\`\`bash
# Cloner le projet
git clone <repository>

# Installer les dépendances
npm install
# ou
pnpm install

# Lancer le serveur de développement
npm run dev
# ou
pnpm dev
\`\`\`

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Première Utilisation

1. **Accueil** : Visitez la page d'accueil
2. **S'inscrire** : Créez un compte entreprise en tant qu'administrateur
3. **Connexion** : Connectez-vous avec vos identifiants
4. **Dashboard** : Accédez à votre tableau de bord personnalisé
5. **Gestion d'équipe** : Invitez des employés via Settings > Gestion Utilisateurs

## Comptes de Test

Pour tester les différents rôles :

\`\`\`
Admin:
Email: admin@buildstock.com
Password: Password123!

Chef de Chantier:
Email: supervisor@buildstock.com
Password: Password123!

Ingénieur:
Email: engineer@buildstock.com
Password: Password123!
\`\`\`

## Technologie Utilisée

- **Framework** : Next.js 16 (App Router)
- **UI Components** : shadcn/ui
- **Styling** : Tailwind CSS v4
- **State Management** : React Context API
- **Charts** : Recharts
- **Icons** : Lucide React
- **Forms** : React Hook Form (optionnel)
- **Type Safety** : TypeScript

## Fonctionnalités de Sécurité

- ✅ Authentification par email/mot de passe
- ✅ Gestion des rôles et permissions basée sur le contexte
- ✅ Validation des entrées utilisateur
- ✅ Protection des routes sensibles
- ✅ Sessions utilisateur persistantes
- ✅ Indicateur de force du mot de passe

## Fonctionnalités Futures

- Intégration base de données (Supabase/Neon)
- API REST complète
- Notifications en temps réel
- Exports PDF/Excel
- Mobile app native
- Intégrations fournisseurs
- Système de backup automatique
- Analytics avancés

## Support

Pour toute question ou problème, contactez notre équipe à support@buildstockpro.com

## Licence

Copyright © 2025 BuildStock Pro. Tous droits réservés.
