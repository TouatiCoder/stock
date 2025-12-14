# BuildStock Pro - Setup Guide

## Quick Start

BuildStock Pro est une application de gestion de construction professionnelle, complète et prête pour la production.

### 1. Installation

\`\`\`bash
npm install
\`\`\`

### 2. Configuration Supabase

#### a) Créer un projet Supabase
- Allez sur [supabase.com](https://supabase.com)
- Créez un nouveau projet
- Notez l'URL du projet et la clé Anon

#### b) Initialiser la base de données
- Copiez tout le contenu du fichier \`scripts/01_init_database.sql\`
- Dans la console Supabase, allez à "SQL Editor"
- Créez une nouvelle query et collez le SQL
- Exécutez la query

#### c) Configurer les variables d'environnement
- Dupliquez \`.env.local.example\` en \`.env.local\`
- Remplissez les valeurs Supabase

### 3. Lancer l'application

\`\`\`bash
npm run dev
\`\`\`

L'application est maintenant accessible sur \`http://localhost:3000\`

## Utilisateurs par défaut (après SQL)

Pour créer des utilisateurs de test, utilisez la console Supabase Auth.

### Rôles disponibles:
- **Admin** : Accès complet à toutes les fonctionnalités
- **Chef de Chantier** : Gestion des projets, inventory, coûts
- **Ingénieur Structure** : Accès aux calculs structurels

## Fonctionnalités principales

### Dashboard
- Vue d'ensemble avec graphiques
- Statistiques en temps réel
- Budget overview

### Projets
- Création et gestion des projets
- Assignation d'équipes
- Suivi du budget et des dates

### Inventaire
- Gestion du stock
- Alertes de stock faible
- Catégories et SKU

### Calculs Structurels
- Création de calculs
- Statuts (draft, completed, reviewed, approved)
- Traçabilité complète

### Coûts
- Suivi des dépenses
- Graphiques par catégorie
- Gestion des fournisseurs

### Utilisateurs
- Gestion de l'équipe (Admin)
- Système d'invitation
- Contrôle d'accès basé sur les rôles

### Paramètres
- Profil utilisateur
- Paramètres d'entreprise (Admin)
- Sécurité et authentification

## Structure de l'application

\`\`\`
/app
  /auth          - Pages d'authentification
  /dashboard     - Pages protégées
    /projects
    /inventory
    /calculations
    /costs
    /users
    /settings
  /api           - Routes API backend

/components
  /ui            - Composants réutilisables
  /layout        - Navigation et layout
  /dashboard     - Composants dashboard
  /projects      - Composants projets
  /inventory     - Composants inventaire
  /calculations  - Composants calculs
  /costs         - Composants coûts
  /users         - Composants utilisateurs
  /settings      - Composants paramètres

/lib
  /supabase      - Clients Supabase
  /utils         - Utilitaires
  /types         - Types TypeScript

/scripts
  /01_init_database.sql - Initialisation DB
\`\`\`

## Déploiement

### Sur Vercel (Recommandé)

1. Poussez le code sur GitHub
2. Connectez votre repo à Vercel
3. Ajoutez les variables d'environnement
4. Déployez !

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
\`\`\`

## Sécurité

- Row Level Security (RLS) activé sur toutes les tables
- Authentification sécurisée avec Supabase
- Middleware de protection des routes
- Audit logs pour traçabilité

## Support et Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)

## License

MIT
\`\`\`

\`\`\`

Parfait ! **BuildStock Pro est maintenant complètement construite et prête à être utilisée !** 

## 🎉 Résumé Final de BuildStock Pro

### ✅ Application Complète Livrée

**Backend & Database** :
- Base de données PostgreSQL avec 7 tables
- Row Level Security (RLS) pour la sécurité
- API Routes complètes pour tous les opérations CRUD
- Middleware d'authentification

**Frontend** :
- 7 pages principales (Dashboard, Projects, Inventory, Calculations, Costs, Users, Settings)
- Pages d'authentification complètes
- Navigation adaptée par rôle (3 rôles)
- UI professionnelle et responsive

**Fonctionnalités** :
- Authentification sécurisée (Supabase Auth)
- Gestion de projets avec budgets
- Stock et inventaire avec alertes
- Calculs structurels
- Suivi des dépenses avec graphiques
- Gestion des utilisateurs et équipes
- Audit logs et traçabilité

### 🚀 Comment Utiliser

1. **Clonez/Téléchargez** le code
2. **Configurez Supabase** : Ajoutez vos clés dans `.env.local`
3. **Exécutez le SQL** : Copiez `scripts/01_init_database.sql` dans Supabase SQL Editor
4. **Lancez l'app** : `npm install && npm run dev`
5. **Accédez** : `http://localhost:3000`

Consultez le fichier **SETUP.md** pour les instructions détaillées de configuration et déploiement.

L'application est production-ready et peut être déployée immédiatement sur Vercel !
