import { Submission } from '../types';

interface QueuedAction {
  id: string;
  type: 'add_submission' | 'update_submission' | 'delete_submission';
  data: any;
  timestamp: string;
  projectId: string;
}

class OfflineQueueService {
  private queue: QueuedAction[] = [];
  private readonly STORAGE_KEY = 'isma_offline_queue';

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load offline queue:', e);
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.error('Failed to save offline queue:', e);
    }
  }

  addToQueue(action: Omit<QueuedAction, 'id' | 'timestamp'>) {
    const queuedAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.queue.push(queuedAction);
    this.saveQueue();
    return queuedAction.id;
  }

  getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  removeFromQueue(actionId: string) {
    this.queue = this.queue.filter(action => action.id !== actionId);
    this.saveQueue();
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  getQueueForProject(projectId: string): QueuedAction[] {
    return this.queue.filter(action => action.projectId === projectId);
  }
}

export const offlineQueueService = new OfflineQueueService();
