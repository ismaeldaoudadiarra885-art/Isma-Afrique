import { offlineQueueService } from './offlineQueueService';
import { Submission, KoboProject } from '../types';
import { detectDuplicates } from '../utils/validation';

interface SyncResult {
  success: boolean;
  failedActions: string[];
  conflicts: any[];
  syncedCount: number;
  totalCount: number;
}

interface ConflictResolution {
  strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  resolvedData?: any;
}

class SyncService {
  private isProcessing = false;
  private syncInProgress = new Set<string>();
  private autoSyncListeners: Map<string, () => void> = new Map();

  // Démarre l'écouteur de synchronisation automatique sur reconnexion
  startAutoSyncListener(projectId: string, onSyncAction: (action: any) => Promise<void>): void {
    if (this.autoSyncListeners.has(projectId)) return; // Évite les doublons

    const handleOnline = () => {
      console.log('🔄 Connexion détectée - Synchronisation automatique démarrée');
      // Délai de 5s pour éviter les spams de reconnexion
      setTimeout(() => {
        if (navigator.onLine) {
          this.processQueue(projectId, onSyncAction);
        }
      }, 5000);
    };

    const handleOffline = () => {
      console.log('📴 Mode hors-ligne détecté - Actions mises en queue');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    this.autoSyncListeners.set(projectId, () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });
  }

  // Arrête l'écouteur pour un projet
  stopAutoSyncListener(projectId: string): void {
    const cleanup = this.autoSyncListeners.get(projectId);
    if (cleanup) {
      cleanup();
      this.autoSyncListeners.delete(projectId);
    }
  }

  async processQueue(projectId: string, onSyncAction: (action: any) => Promise<void>): Promise<SyncResult> {
    if (this.isProcessing || this.syncInProgress.has(projectId)) {
      return { success: false, failedActions: [], conflicts: [], syncedCount: 0, totalCount: 0 };
    }

    this.isProcessing = true;
    this.syncInProgress.add(projectId);

    const queue = offlineQueueService.getQueueForProject(projectId);
    const failedActions: string[] = [];
    const conflicts: any[] = [];
    let syncedCount = 0;

    console.log(`🔄 Début synchronisation projet ${projectId} - ${queue.length} actions en attente`);

    for (const action of queue) {
      try {
        // Validation gate for submissions
        if (action.type === 'add_submission' || action.type === 'update_submission') {
          const submission = action.data as Submission;
          if (submission.validationStatus === 'pending' || submission.validationStatus === 'rejected') {
            console.log(`⏳ Submission ${submission.id} en attente de validation - mise en queue pour revue`);
            continue; // Skip sync, keep in queue for supervisor review
          }
          if (submission.validationStatus === 'auto_flagged') {
            // Flag for supervisor attention but allow sync with warning
            console.warn(`⚠️ Submission ${submission.id} auto-flagged - synchronisation avec avertissement`);
          }
        }

        await onSyncAction(action);
        offlineQueueService.removeFromQueue(action.id);
        syncedCount++;
        console.log(`✅ Action ${action.type} synchronisée`);
      } catch (error) {
        console.error(`❌ Échec synchronisation action ${action.id}:`, error);
        failedActions.push(action.id);

        // Tentatives de retry avec backoff exponentiel
        const retrySuccess = await this.retryAction(action, onSyncAction);
        if (retrySuccess) {
          syncedCount++;
        } else {
          // Gestion des conflits
          const conflict = await this.detectConflict(action);
          if (conflict) {
            conflicts.push(conflict);
          }
        }
      }
    }

    this.isProcessing = false;
    this.syncInProgress.delete(projectId);

    const result = {
      success: failedActions.length === 0,
      failedActions,
      conflicts,
      syncedCount,
      totalCount: queue.length
    };

    console.log(`🔄 Fin synchronisation: ${syncedCount}/${queue.length} actions réussies`);
    return result;
  }

  validateBeforeSync(action: any, currentUserRole: string): boolean {
    if (action.type === 'add_submission' || action.type === 'update_submission') {
      const submission = action.data as Submission;
      if (submission.validationStatus !== 'validated' && currentUserRole !== 'supervisor' && currentUserRole !== 'admin' && currentUserRole !== 'super_admin') {
        return false;
      }
    }
    return true;
  }

  private async retryAction(action: any, onSyncAction: (action: any) => Promise<void>, retries = 3, delay = 1000): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        await onSyncAction(action);
        offlineQueueService.removeFromQueue(action.id);
        console.log(`🔄 Retry réussi pour action ${action.id} (tentative ${i + 1})`);
        return true;
      } catch (error) {
        console.error(`🔄 Retry ${i + 1} échoué pour action ${action.id}:`, error);
      }
    }
    return false;
  }

  private async detectConflict(action: any): Promise<any | null> {
    // Logique de détection de conflits basique
    // À améliorer selon les besoins spécifiques
    if (action.type === 'update_submission' || action.type === 'add_submission') {
      const submission = action.data as Submission;
      // Check for duplicates
      // Assuming access to all submissions; in practice, fetch from store or Supabase
      // For now, simulate
      const allSubmissions: Submission[] = []; // Replace with actual fetch
      const duplicates = detectDuplicates([submission, ...allSubmissions]);
      if (duplicates.length > 0) {
        return {
          actionId: action.id,
          type: 'duplicate_conflict',
          duplicates: duplicates.map(d => d.id),
          resolution: 'manual'
        };
      }

      if (action.type === 'update_submission') {
        return {
          actionId: action.id,
          type: 'submission_conflict',
          serverVersion: null, // À récupérer du serveur
          clientVersion: action.data,
          resolution: 'manual'
        };
      }
    }
    return null;
  }

  async resolveConflict(conflict: any, resolution: ConflictResolution): Promise<void> {
    switch (resolution.strategy) {
      case 'server_wins':
        // Annuler l'action locale
        offlineQueueService.removeFromQueue(conflict.actionId);
        break;
      case 'client_wins':
        // Forcer la synchronisation
        // await this.forceSyncAction(conflict.action);
        break;
      case 'merge':
        // Fusionner les données
        if (resolution.resolvedData) {
          // await this.syncMergedData(conflict, resolution.resolvedData);
        }
        break;
      case 'manual':
        // Marquer pour résolution manuelle
        console.log('Conflit marqué pour résolution manuelle:', conflict);
        break;
    }
  }

  async syncWithExternalServer(
    projectId: string,
    submissions: Submission[],
    serverUrl: string,
    apiToken: string,
    lastSyncTimestamp?: string
  ): Promise<SyncResult> {
    console.log(`🔄 Synchronisation avec serveur externe: ${serverUrl} pour projet ${projectId}`);

    try {
      // Récupérer les données du serveur depuis le dernier sync
      const serverData = await this.fetchServerData(serverUrl, apiToken, projectId, lastSyncTimestamp);

      // Comparer et fusionner les données
      const { toUpload, toDownload, conflicts } = await this.compareData(submissions, serverData);

      // Télécharger les nouvelles données du serveur
      let syncedCount = 0;
      for (const item of toDownload) {
        try {
          await this.applyServerData(item);
          syncedCount++;
        } catch (error) {
          console.error('Erreur application données serveur:', error);
        }
      }

      // Uploader les données locales
      for (const item of toUpload) {
        try {
          await this.uploadToServer(serverUrl, apiToken, item);
          syncedCount++;
        } catch (error) {
          console.error('Erreur upload vers serveur:', error);
        }
      }

      return {
        success: conflicts.length === 0,
        failedActions: [],
        conflicts,
        syncedCount,
        totalCount: toUpload.length + toDownload.length
      };

    } catch (error) {
      console.error('Erreur synchronisation serveur externe:', error);
      return {
        success: false,
        failedActions: ['external_sync_failed'],
        conflicts: [],
        syncedCount: 0,
        totalCount: submissions.length
      };
    }
  }

  private async fetchServerData(serverUrl: string, apiToken: string, projectId: string, since?: string): Promise<any[]> {
    // Simulation - à remplacer par appels API réels
    console.log(`📡 Récupération données serveur depuis ${since || 'début'}`);
    return [];
  }

  private async compareData(localData: Submission[], serverData: any[]): Promise<{
    toUpload: Submission[];
    toDownload: any[];
    conflicts: any[];
  }> {
    // Logique de comparaison basique
    const toUpload = localData.filter(local =>
      !serverData.some(server => server.id === local.id)
    );

    const toDownload = serverData.filter(server =>
      !localData.some(local => local.id === server.id)
    );

    const conflicts = localData.filter(local =>
      serverData.some(server =>
        server.id === local.id &&
        server.updatedAt &&
        new Date(server.updatedAt) > new Date((local as any).updatedAt)
      )
    ).map(item => ({
      type: 'version_conflict',
      localData: item,
      serverData: serverData.find(s => s.id === item.id)
    }));

    return { toUpload, toDownload, conflicts };
  }

  private async applyServerData(data: any): Promise<void> {
    // Appliquer les données du serveur localement
    console.log('📥 Application données serveur:', data.id);
  }

  private async uploadToServer(serverUrl: string, apiToken: string, data: any): Promise<void> {
    // Uploader vers le serveur
    console.log('📤 Upload vers serveur:', data.id);
  }

  // Cache intelligent pour éviter les téléchargements répétés
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  async getCachedData(key: string): Promise<any | null> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCachedData(key: string, data: any, ttl = 300000): void { // 5 minutes par défaut
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  // Mode dégradé pour fonctionnalités essentielles hors ligne
  async getDegradedModeCapabilities(): Promise<string[]> {
    return [
      'collecte_données',
      'sauvegarde_locale',
      'validation_basique',
      'export_pdf'
    ];
  }

  // Synchronisation bidirectionnelle intelligente
  async smartBidirectionalSync(project: KoboProject, serverUrl: string, apiToken: string): Promise<SyncResult> {
    console.log('🔄 Synchronisation bidirectionnelle intelligente démarrée');

    // 1. Analyse des changements locaux
    const localChanges = offlineQueueService.getQueueForProject(project.id);

    // 2. Récupération des changements serveur
    const serverChanges = await this.fetchServerData(serverUrl, apiToken, project.id);

    // 3. Résolution automatique des conflits simples
    const resolvedConflicts = await this.autoResolveConflicts(localChanges, serverChanges);

    // 4. Application des changements
    const syncResult = await this.applyChanges(localChanges, serverChanges, resolvedConflicts);

    console.log('🔄 Synchronisation bidirectionnelle terminée');
    return syncResult;
  }

  private async autoResolveConflicts(localChanges: any[], serverChanges: any[]): Promise<any[]> {
    // Logique de résolution automatique des conflits
    const resolved = [];

    for (const local of localChanges) {
      const serverMatch = serverChanges.find(s => s.id === local.data?.id);
      if (serverMatch) {
        // Conflit détecté - résolution basée sur timestamp
        if (new Date(local.timestamp) > new Date(serverMatch.timestamp)) {
          resolved.push({ strategy: 'client_wins', data: local });
        } else {
          resolved.push({ strategy: 'server_wins', data: serverMatch });
        }
      }
    }

    return resolved;
  }

  private async applyChanges(localChanges: any[], serverChanges: any[], resolvedConflicts: any[]): Promise<SyncResult> {
    let syncedCount = 0;
    const failedActions: string[] = [];

    // Appliquer les changements locaux
    for (const change of localChanges) {
      try {
        await this.applyLocalChange(change);
        syncedCount++;
      } catch (error) {
        failedActions.push(change.id);
      }
    }

    // Appliquer les changements serveur
    for (const change of serverChanges) {
      try {
        await this.applyServerChange(change);
        syncedCount++;
      } catch (error) {
        console.error('Erreur application changement serveur:', error);
      }
    }

    return {
      success: failedActions.length === 0,
      failedActions,
      conflicts: resolvedConflicts,
      syncedCount,
      totalCount: localChanges.length + serverChanges.length
    };
  }

  private async applyLocalChange(change: any): Promise<void> {
    console.log('📤 Application changement local:', change.type);
  }

  private async applyServerChange(change: any): Promise<void> {
    console.log('📥 Application changement serveur:', change.type);
  }
}

export const syncService = new SyncService();
