# Déploiement Supabase pour Application Multi-ONG

## Vue d'ensemble
Cette mise à jour transforme votre application KoboToolbox en plateforme multi-ONG avec contrôle centralisé, utilisant Supabase comme backend.

## Architecture
```
Frontend (React/Vite) ←→ Supabase ←→ ONG A, ONG B, ONG C
     ↓                        ↓
Interface Admin          Base de données isolée
(Contrôle centralisé)    par organisation
```

## Installation et Configuration

### 1. Créer un projet Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL et la clé API

### 2. Configuration des variables d'environnement
Créez un fichier `.env` à la racine du projet :
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Configuration de la base de données
1. Dans Supabase Dashboard → SQL Editor
2. Exécutez le contenu du fichier `sql/schema.sql`
3. Cela créera toutes les tables et politiques de sécurité

### 4. Configuration de l'authentification
1. Dans Supabase Dashboard → Authentication → Settings
2. Désactivez "Enable email confirmations" pour le développement
3. Configurez les URLs de redirection si nécessaire

## Utilisation

### Mode Super Admin
- Connectez-vous avec le rôle `super_admin`
- Accédez au panel "Admin" dans la barre de navigation
- Gérez les organisations et leurs utilisateurs

### Gestion des ONG
1. **Créer une organisation** : Nom, description, email admin
2. **Ajouter des utilisateurs** : Génère automatiquement des codes d'accès
3. **Contrôler l'accès** : Activez/désactivez les organisations
4. **Monitorer l'usage** : Visualisez les projets et soumissions

### Pour les ONG
- Les utilisateurs se connectent avec leur code d'accès
- Données automatiquement isolées par organisation
- Interface identique à l'application actuelle

## Fonctionnalités ajoutées

### Sécurité
- **Row Level Security (RLS)** : Isolation automatique des données
- **Politiques d'accès** : Contrôle granulaire des permissions
- **Authentification centralisée** : Un seul point de contrôle

### Gestion
- **Panel d'administration** : Interface web pour gérer les ONG
- **Codes d'accès** : Système simple pour les enquêteurs
- **Quotas configurables** : Limites par organisation

### Évolutivité
- **Multi-tenant** : Supporte centaines d'ONG
- **Synchronisation temps réel** : Données à jour automatiquement
- **API REST/GraphQL** : Extensible pour futures fonctionnalités

## Migration des données existantes

Si vous avez des données locales à migrer :

1. Exportez vos projets depuis l'application actuelle
2. Créez une organisation dans Supabase
3. Importez les données via l'interface admin

## Déploiement

### Frontend (Netlify recommandé)
```bash
npm run build
# Déployez le dossier dist sur Netlify
```

### Backend
Supabase gère automatiquement le backend - pas de déploiement supplémentaire requis.

## Support et Maintenance

### Monitoring
- Supabase Dashboard pour les métriques
- Logs d'audit automatiques
- Alertes configurables

### Sauvegarde
- Sauvegardes automatiques Supabase
- Export manuel disponible
- Récupération point-in-time

### Coûts
- **Gratuit** : 500MB DB, 50MB fichiers, 2GB bandwidth
- **Payant** : À partir de $25/mois pour usage professionnel

## Dépannage

### Problèmes courants
1. **Erreur de connexion** : Vérifiez les variables d'environnement
2. **Permissions refusées** : Vérifiez les politiques RLS
3. **Données non visibles** : Vérifiez l'isolation par organisation

### Debug
- Console du navigateur pour les erreurs frontend
- Supabase Dashboard → Logs pour les erreurs backend
- Network tab pour les appels API

## Prochaines étapes

1. **Test en production** : Déployez sur un domaine personnalisé
2. **Formation ONG** : Créez des guides d'utilisation
3. **Support utilisateurs** : Système de tickets/helpdesk
4. **Analytics avancés** : Tableaux de bord par ONG

---

Cette architecture vous donne un contrôle total sur les ONG utilisant votre plateforme tout en maintenant la simplicité d'utilisation.
