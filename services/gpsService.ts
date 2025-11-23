export interface GPSCoordinates {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    timestamp: string;
}

export interface GPSOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}

export interface GPSResult {
    success: boolean;
    coordinates?: GPSCoordinates;
    error?: string;
}

class GPSService {
    private watchId: number | null = null;
    private currentPosition: GPSCoordinates | null = null;

    // Obtenir la position actuelle
    async getCurrentPosition(options: GPSOptions = {}): Promise<GPSResult> {
        const defaultOptions: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
            ...options
        };

        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve({
                    success: false,
                    error: 'La géolocalisation n\'est pas supportée par ce navigateur'
                });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coordinates: GPSCoordinates = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude || undefined,
                        timestamp: new Date().toISOString()
                    };

                    this.currentPosition = coordinates;
                    resolve({
                        success: true,
                        coordinates
                    });
                },
                (error) => {
                    let errorMessage = 'Erreur de géolocalisation inconnue';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Permission de géolocalisation refusée';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Position indisponible';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Timeout de géolocalisation';
                            break;
                    }

                    resolve({
                        success: false,
                        error: errorMessage
                    });
                },
                defaultOptions
            );
        });
    }

    // Surveiller les changements de position
    startWatchingPosition(options: GPSOptions = {}, callback?: (coordinates: GPSCoordinates) => void): void {
        if (!navigator.geolocation) {
            console.error('La géolocalisation n\'est pas supportée par ce navigateur');
            return;
        }

        const defaultOptions: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
            ...options
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const coordinates: GPSCoordinates = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude || undefined,
                    timestamp: new Date().toISOString()
                };

                this.currentPosition = coordinates;
                if (callback) {
                    callback(coordinates);
                }
            },
            (error) => {
                console.error('Erreur de surveillance GPS:', error);
            },
            defaultOptions
        );
    }

    // Arrêter la surveillance
    stopWatchingPosition(): void {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    // Obtenir la dernière position connue
    getLastKnownPosition(): GPSCoordinates | null {
        return this.currentPosition;
    }

    // Calculer la distance entre deux points (en mètres)
    calculateDistance(coord1: GPSCoordinates, coord2: GPSCoordinates): number {
        const R = 6371e3; // Rayon de la Terre en mètres
        const φ1 = coord1.latitude * Math.PI / 180;
        const φ2 = coord2.latitude * Math.PI / 180;
        const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
        const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    // Vérifier si les coordonnées sont dans une région donnée (utile pour la validation)
    isWithinRegion(coordinates: GPSCoordinates, regionBounds: {
        north: number;
        south: number;
        east: number;
        west: number;
    }): boolean {
        return coordinates.latitude >= regionBounds.south &&
               coordinates.latitude <= regionBounds.north &&
               coordinates.longitude >= regionBounds.west &&
               coordinates.longitude <= regionBounds.east;
    }

    // Obtenir l'adresse approximative (reverse geocoding basique pour le Mali)
    getApproximateLocation(coordinates: GPSCoordinates): string {
        // Données simplifiées pour les régions maliennes
        const regions = [
            { name: 'Bamako', lat: 12.6392, lng: -8.0029, radius: 50000 },
            { name: 'Kayes', lat: 14.4469, lng: -11.4453, radius: 30000 },
            { name: 'Koulikoro', lat: 12.8627, lng: -7.5599, radius: 25000 },
            { name: 'Sikasso', lat: 11.3177, lng: -5.6665, radius: 25000 },
            { name: 'Ségou', lat: 13.4317, lng: -6.2482, radius: 25000 },
            { name: 'Mopti', lat: 14.4843, lng: -4.1830, radius: 25000 },
            { name: 'Tombouctou', lat: 16.7666, lng: -3.0026, radius: 25000 },
            { name: 'Gao', lat: 16.2639, lng: -0.0278, radius: 25000 },
            { name: 'Kidal', lat: 18.4411, lng: 1.4078, radius: 25000 }
        ];

        for (const region of regions) {
            const distance = this.calculateDistance(coordinates, {
                latitude: region.lat,
                longitude: region.lng,
                timestamp: ''
            });

            if (distance <= region.radius) {
                return region.name;
            }
        }

        return 'Région non identifiée';
    }

    // Vérifier les permissions GPS
    async checkPermissions(): Promise<boolean> {
        if ('permissions' in navigator) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                return result.state === 'granted';
            } catch (error) {
                console.warn('Erreur lors de la vérification des permissions GPS:', error);
            }
        }
        return false;
    }

    // Demander les permissions GPS
    async requestPermissions(): Promise<boolean> {
        try {
            const result = await this.getCurrentPosition();
            return result.success;
        } catch (error) {
            return false;
        }
    }
}

export const gpsService = new GPSService();
