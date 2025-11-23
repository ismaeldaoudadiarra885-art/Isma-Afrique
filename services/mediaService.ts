import { Submission } from '../types';

export interface MediaFile {
    id: string;
    name: string;
    type: string;
    size: number;
    data: string; // Base64 encoded data
    submissionId: string;
    questionName: string;
    uploadedAt: string;
    synced: boolean;
}

export interface MediaUploadResult {
    success: boolean;
    mediaId?: string;
    error?: string;
}

class MediaService {
    private mediaStore: Map<string, MediaFile> = new Map();

    // Store media file locally (for offline mode)
    async storeMediaLocally(file: File, submissionId: string, questionName: string): Promise<MediaUploadResult> {
        try {
            const mediaId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Convert file to base64
            const base64Data = await this.fileToBase64(file);

            const mediaFile: MediaFile = {
                id: mediaId,
                name: file.name,
                type: file.type,
                size: file.size,
                data: base64Data,
                submissionId,
                questionName,
                uploadedAt: new Date().toISOString(),
                synced: false
            };

            // Store in memory (in production, this would be IndexedDB or local storage)
            this.mediaStore.set(mediaId, mediaFile);

            // Also store in localStorage for persistence
            this.persistMediaLocally(mediaFile);

            return { success: true, mediaId };
        } catch (error) {
            console.error('Error storing media locally:', error);
            return { success: false, error: 'Failed to store media file locally' };
        }
    }

    // Upload media to server when online
    async uploadMedia(mediaId: string, serverUrl: string, apiToken: string): Promise<MediaUploadResult> {
        const mediaFile = this.mediaStore.get(mediaId);
        if (!mediaFile) {
            return { success: false, error: 'Media file not found' };
        }

        try {
            // Convert base64 back to blob for upload
            const blob = this.base64ToBlob(mediaFile.data, mediaFile.type);

            const formData = new FormData();
            formData.append('file', blob, mediaFile.name);
            formData.append('submission_id', mediaFile.submissionId);
            formData.append('question_name', mediaFile.questionName);

            const response = await fetch(`${serverUrl}/api/media/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${apiToken}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                mediaFile.synced = true;
                this.updateMediaFile(mediaFile);
                return { success: true, mediaId: result.id };
            } else {
                return { success: false, error: `Upload failed: ${response.statusText}` };
            }
        } catch (error) {
            console.error('Error uploading media:', error);
            return { success: false, error: 'Network error during upload' };
        }
    }

    // Get media file by ID
    getMedia(mediaId: string): MediaFile | undefined {
        return this.mediaStore.get(mediaId);
    }

    // Get all media files for a submission
    getSubmissionMedia(submissionId: string): MediaFile[] {
        return Array.from(this.mediaStore.values()).filter(media => media.submissionId === submissionId);
    }

    // Get unsynced media files
    getUnsyncedMedia(): MediaFile[] {
        return Array.from(this.mediaStore.values()).filter(media => !media.synced);
    }

    // Compress image if needed
    async compressImage(file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<File> {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const img = new Image();

            img.onload = () => {
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        resolve(file); // Return original if compression fails
                    }
                }, file.type, quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // Validate media file
    validateMediaFile(file: File): { valid: boolean, error?: string } {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav', 'video/mp4'];

        if (file.size > maxSize) {
            return { valid: false, error: 'File size exceeds 10MB limit' };
        }

        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'File type not supported' };
        }

        return { valid: true };
    }

    // Clean up old media files (for storage management)
    cleanupOldMedia(daysOld: number = 30): void {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        for (const [id, media] of this.mediaStore) {
            if (new Date(media.uploadedAt) < cutoffDate && media.synced) {
                this.mediaStore.delete(id);
                this.removePersistedMedia(id);
            }
        }
    }

    // Private helper methods
    private async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    private base64ToBlob(base64: string, type: string): Blob {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type });
    }

    private persistMediaLocally(mediaFile: MediaFile): void {
        try {
            const mediaList = JSON.parse(localStorage.getItem('mediaFiles') || '[]');
            mediaList.push(mediaFile);
            localStorage.setItem('mediaFiles', JSON.stringify(mediaList));
        } catch (error) {
            console.error('Error persisting media locally:', error);
        }
    }

    private updateMediaFile(mediaFile: MediaFile): void {
        this.mediaStore.set(mediaFile.id, mediaFile);
        this.persistMediaLocally(mediaFile);
    }

    private removePersistedMedia(mediaId: string): void {
        try {
            const mediaList = JSON.parse(localStorage.getItem('mediaFiles') || '[]');
            const filteredList = mediaList.filter((media: MediaFile) => media.id !== mediaId);
            localStorage.setItem('mediaFiles', JSON.stringify(filteredList));
        } catch (error) {
            console.error('Error removing persisted media:', error);
        }
    }

    // Load persisted media on service initialization
    loadPersistedMedia(): void {
        try {
            const mediaList = JSON.parse(localStorage.getItem('mediaFiles') || '[]');
            mediaList.forEach((media: MediaFile) => {
                this.mediaStore.set(media.id, media);
            });
        } catch (error) {
            console.error('Error loading persisted media:', error);
        }
    }
}

export const mediaService = new MediaService();

// Initialize persisted media on module load
mediaService.loadPersistedMedia();
