# Guide de Déploiement Pilote pour Application Multi-ONG

## 1. Préparation du Déploiement Pilote

### Étape 1.1 : Vérification de l'environnement
- Assurez-vous que le build a été effectué avec succès : `npm run build`
- Vérifiez que le dossier `dist/` contient `index.html` et le dossier `assets/`
- Confirmez que les variables d'environnement sont configurées dans Netlify (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GEMINI_API_KEY)

### Étape 1.2 : Configuration Netlify
1. Installez Netlify CLI si ce n'est pas fait :
   ```
   npm install -g netlify-cli
   ```
2. Connectez-vous à Netlify :
   ```
   netlify login
   ```
3. Initialisez le site (si pas déjà fait) :
   ```
   netlify init
   ```
   - Sélectionnez "Create & configure a new site"
   - Choisissez un nom de site (ex: `pilot-multi-ong-app`)

### Étape 1.3 : Déploiement Initial
1. Déployez en mode pilote (draft) :
   ```
   netlify deploy --dir=dist --alias pilot-draft
   ```
2. Une fois validé, déployez en production :
   ```
   netlify deploy --prod --dir=dist
   ```
3. Notez l'URL de déploiement (ex: `https://pilot-multi-ong-app.netlify.app`)

### Étape 1.4 : Configuration des Variables d'Environnement sur Netlify
1. Allez sur [app.netlify.com](https://app.netlify.com)
2. Sélectionnez votre site
3. Allez dans "Site settings" > "Environment variables"
4. Ajoutez :
   - `VITE_SUPABASE_URL` : Votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` : Votre clé anon Supabase
   - `VITE_GEMINI_API_KEY` : Votre clé Gemini API
   - `VITE_DEMO_MODE` : `false` (pour production)

## 2. Configuration Supabase pour le Pilote

### Étape 2.1 : Création d'Organisations Test
1. Connectez-vous en tant que super admin sur l'application déployée
2. Créez 2-3 organisations test :
   - ONG Test 1 : "Pilote Humanitaire" (admin: pilote1@test.org)
   - ONG Test 2 : "Pilote Développement" (admin: pilote2@test.org)
   - ONG Test 3 : "Pilote Santé" (admin: pilote3@test.org)

### Étape 2.2 : Création d'Utilisateurs Test
Pour chaque organisation, créez :
- 1 Admin (rôle: admin)
- 2 Managers de projet (rôle: project_manager)
- 5 Énumérateurs (rôle: enumerator)

Exemple de codes d'accès générés :
- PIL-123 pour admin
- MAN-456 pour manager
- ENUM-789 pour énumérateur

### Étape 2.3 : Test des Flux Critiques
1. **Connexion** : Testez tous les codes d'accès
2. **Création de projets** : Créez un formulaire simple dans chaque org
3. **Soumissions** : Simulez 10-20 soumissions par projet
4. **Isolation des données** : Vérifiez que les données d'une org ne sont pas visibles par une autre
5. **Panel Admin** : Activez/désactivez une org et vérifiez l'impact

## 3. Formation Utilisateurs et Guides

### Étape 3.1 : Création des Guides Utilisateurs
Créez les fichiers suivants dans un dossier `docs/` :

#### Guide Super Admin (SUPER_ADMIN_GUIDE.md)
```
# Guide Super Administrateur

## Accès
- URL : [Votre URL de déploiement]
- Rôle : super_admin (contactez le support pour l'accès)

## Gestion des Organisations
1. Cliquez sur "Admin" dans la barre de navigation
2. Visualisez toutes les organisations
3. Créez une nouvelle organisation :
   - Nom, description, email admin
   - Définissez les quotas (projets max, utilisateurs max)
4. Gérez les utilisateurs par organisation
5. Activez/désactivez les organisations

## Monitoring
- Utilisez le dashboard Supabase pour les logs
- Vérifiez les quotas et l'usage
```

#### Guide ONG Admin (ONG_ADMIN_GUIDE.md)
```
# Guide Administrateur ONG

## Connexion
- Utilisez votre code d'accès fourni
- Exemple : ADM-123

## Création de Projets
1. Cliquez sur "Nouveau Projet"
2. Importez ou créez un formulaire XLSForm
3. Configurez les paramètres du projet

## Gestion des Équipes
1. Allez dans "Équipe"
2. Ajoutez des enquêteurs avec leurs noms
3. Distribuez les codes d'accès générés

## Analyse des Données
1. Visualisez les soumissions en temps réel
2. Exportez en Excel/PDF
3. Utilisez l'IA pour l'analyse (Gemini)
```

#### Guide Énumérateur (ENUMERATOR_GUIDE.md)
```
# Guide Énumérateur Terrain

## Connexion
- Ouvrez l'application sur votre appareil
- Entrez votre code d'accès (ex: ENUM-456)
- Sélectionnez votre projet

## Collecte de Données
1. Remplissez le formulaire étape par étape
2. Prenez des photos si nécessaire
3. Validez et soumettez

## Astuces
- Fonctionne offline (synchro automatique)
- Sauvegarde automatique des brouillons
- Support multilingue disponible
```

### Étape 3.2 : Formation des Utilisateurs Pilote
1. **Session Zoom** (1h) pour les admins des ONG test
2. **Démo en direct** : Connexion, création projet, soumission
3. **Q&A** et distribution des guides PDF
4. **Support WhatsApp/Email** pour les 2 premières semaines

## 4. Monitoring Production

### Étape 4.1 : Configuration Supabase Monitoring
1. Activez les logs dans Supabase Dashboard > Logs
2. Configurez les alertes email pour :
   - Erreurs d'authentification > 10/jour
   - Usage DB > 80% quota
   - Échecs API > 5%

### Étape 4.2 : Monitoring Netlify
1. Activez "Deploy notifications" dans Netlify
2. Configurez les alertes pour downtime
3. Utilisez Netlify Analytics pour le trafic

### Étape 4.3 : Métriques Clés à Suivre
- **Taux de connexion réussie** : > 95%
- **Temps de réponse API** : < 2s
- **Taux d'erreur soumissions** : < 1%
- **Utilisation quotas** : Par organisation

### Étape 4.4 : Outils Recommandés
- **Sentry** pour les erreurs frontend
- **Supabase Edge Functions** pour les logs custom
- **Google Analytics** pour l'usage utilisateur

## 5. Optimisations Futures

### Étape 5.1 : Cache et Performance
1. **Service Worker** : Ajoutez PWA pour offline avancé
2. **Netlify Edge Caching** : Activez pour les assets statiques
3. **Supabase Realtime** : Optimisez les subscriptions pour éviter les polls inutiles

### Étape 5.2 : CDN pour Fichiers Statiques
- Netlify gère déjà le CDN global
- Pour les formulaires XLSX : Utilisez Supabase Storage avec CDN activé
- Configurez les headers cache dans `netlify.toml` :
  ```
  [[headers]]
    for = "/assets/*"
    [headers.values]
      Cache-Control = "public, max-age=31536000"
  ```

### Étape 5.3 : Scaling
- **Auto-scaling Supabase** : Passe au plan Pro si > 50 ONG
- **Database Indexing** : Ajoutez des indexes sur les champs fréquemment queryés
- **Query Optimization** : Utilisez Supabase Studio pour analyser les queries lentes

## 6. Plan de Rollout Post-Pilote

### Semaine 1-2 : Pilote
- 3 ONG test
- Collecte feedback quotidien
- Corrections immédiates

### Semaine 3 : Évaluation
- Rapport de performance
- Satisfaction utilisateurs (> 8/10)
- Décision go/no-go

### Semaine 4+ : Production
- Onboarding 10+ nouvelles ONG
- Formation continue
- Support dédié

## Contacts Support
- Email : support@multi-ong-app.com
- WhatsApp : +33 1 23 45 67 89
- Heures : Lun-Ven 9h-18h UTC

---

Ce guide assure un déploiement pilote fluide et professionnel. Contactez-moi pour toute assistance technique.
