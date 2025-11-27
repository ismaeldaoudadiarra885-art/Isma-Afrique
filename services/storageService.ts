
import { KoboProject } from '../types';

const DB_NAME = 'isma_db_v1';
const STORE_NAME = 'projects';

// Helper pour ouvrir la base de données
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

export const storageService = {
    // Sauvegarder un projet complet
    saveProject: async (project: KoboProject): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            // On utilise put qui fait office d'insert ou update
            const request = store.put(project);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // Récupérer tous les projets (pour la liste)
    getAllProjects: async (): Promise<KoboProject[]> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    // Récupérer un projet spécifique
    getProject: async (id: string): Promise<KoboProject | undefined> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Supprimer un projet
    deleteProject: async (id: string): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // Migration depuis localStorage (exécuté une seule fois)
    migrateFromLocalStorage: async (): Promise<void> => {
        const LOCAL_STORAGE_KEY = 'isma_projects_store';
        const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
        
        if (rawData) {
            try {
                const projects = JSON.parse(rawData) as KoboProject[];
                if (Array.isArray(projects) && projects.length > 0) {
                    console.log(`Migration de ${projects.length} projets depuis localStorage vers IndexedDB...`);
                    for (const p of projects) {
                        await storageService.saveProject(p);
                    }
                    // Une fois migré, on nettoie pour éviter la confusion, 
                    // ou on renomme la clé pour garder un backup au cas où.
                    localStorage.setItem(LOCAL_STORAGE_KEY + '_backup', rawData);
                    localStorage.removeItem(LOCAL_STORAGE_KEY);
                }
            } catch (e) {
                console.error("Erreur migration localStorage:", e);
            }
        }
    }
};
