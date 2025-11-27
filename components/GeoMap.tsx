
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { getLocalizedText } from '../utils/localizationUtils';

// Déclaration globale pour Leaflet (chargé via CDN dans index.html)
declare const L: any;

const GeoMap: React.FC = () => {
    const { activeProject } = useProject();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [showAll, setShowAll] = useState(false);

    const geoData = useMemo(() => {
        if (!activeProject) return { points: [], bounds: null };
        const { submissions, formData } = activeProject;
        
        const geoQuestion = formData.survey.find(q => q.type === 'geopoint');
        if (!geoQuestion) return { points: [], bounds: null };

        const points: { id: string, label: string, lat: number, lon: number, agent: string }[] = [];
        
        submissions.forEach(s => {
            const val = s.data[geoQuestion.name];
            if (val && typeof val === 'string') {
                const parts = val.split(' ');
                if (parts.length >= 2) {
                    const lat = parseFloat(parts[0]);
                    const lon = parseFloat(parts[1]);
                    if (!isNaN(lat) && !isNaN(lon)) {
                        points.push({ 
                            id: s.id, 
                            label: s.id.substring(0,6), 
                            lat, 
                            lon,
                            agent: s.metadata?.agentName || 'Inconnu'
                        });
                    }
                }
            }
        });

        return { 
            points, 
            questionLabel: getLocalizedText(geoQuestion.label, formData.settings.default_language || 'default')
        };
    }, [activeProject]);

    // Filtrage pour performances
    const visiblePoints = useMemo(() => {
        // Si plus de 200 points, on limite l'affichage initial pour éviter le lag sur mobile
        if (!showAll && geoData.points.length > 200) {
            return geoData.points.slice(-100); // Les 100 derniers
        }
        return geoData.points;
    }, [geoData.points, showAll]);

    // Effet pour initialiser et mettre à jour la carte
    useEffect(() => {
        // Si pas de données ou pas de container, on sort
        if (!mapContainerRef.current) return;

        // Si Leaflet n'est pas chargé (hors ligne sans cache), afficher fallback
        if (typeof L === 'undefined') return;

        // Initialisation de la carte si pas encore fait
        if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapContainerRef.current).setView([12.6392, -8.0029], 6); // Centré sur Bamako par défaut

            // Ajout des tuiles OSM (OpenStreetMap)
            // Note: En mode strictement hors ligne, les tuiles ne chargeront pas, on aura un fond gris.
            // Mais les points seront positionnés correctement spatialement.
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapInstanceRef.current);
        }

        const map = mapInstanceRef.current;

        // Nettoyage des marqueurs existants
        markersRef.current.forEach(m => map.removeLayer(m));
        markersRef.current = [];

        // Ajout des marqueurs optimisé
        const bounds = L.latLngBounds([]);
        
        if (visiblePoints.length > 0) {
            visiblePoints.forEach(p => {
                const marker = L.marker([p.lat, p.lon])
                    .bindPopup(`
                        <div style="font-family: sans-serif; font-size: 12px;">
                            <b>ID: ${p.label}</b><br/>
                            Agent: ${p.agent}<br/>
                            <span style="color: #666;">${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</span>
                        </div>
                    `);
                marker.addTo(map);
                markersRef.current.push(marker);
                bounds.extend([p.lat, p.lon]);
            });

            // Ajuster la vue pour inclure tous les points (avec un petit délai pour laisser le DOM s'afficher)
            setTimeout(() => {
                map.fitBounds(bounds, { padding: [50, 50] });
            }, 200);
        }

    }, [visiblePoints]);

    const handleRecenter = () => {
        if (mapInstanceRef.current && visiblePoints.length > 0) {
             const bounds = L.latLngBounds([]);
             visiblePoints.forEach(p => bounds.extend([p.lat, p.lon]));
             mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
    };

    // Fallback si pas de points
    if (!geoData.points.length) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 p-8">
                <span className="text-4xl mb-3">🌍</span>
                <p className="text-base font-medium">Aucune donnée géographique</p>
                <p className="text-xs mt-1">Assurez-vous d'avoir une question 'geopoint' et des soumissions valides.</p>
            </div>
        );
    }

    // Fallback si Leaflet n'est pas chargé (hors ligne strict sans cache CDN)
    if (typeof L === 'undefined') {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-center p-4">
                <p className="text-red-500 font-bold">Mode Hors-Ligne Strict</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    La carte interactive nécessite une connexion internet initiale pour charger les librairies.
                    Veuillez vous connecter une fois pour mettre en cache la carte.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border dark:border-gray-700">
            <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex justify-between items-center flex-wrap gap-2">
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                        <span>🗺️</span> Carte Interactive
                    </h3>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{geoData.questionLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                    {geoData.points.length > 200 && (
                        <button 
                            onClick={() => setShowAll(!showAll)}
                            className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded hover:bg-gray-100 text-indigo-600"
                        >
                            {showAll ? "Limiter (100)" : `Tout voir (${geoData.points.length})`}
                        </button>
                    )}
                    <button 
                        onClick={handleRecenter}
                        className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded hover:bg-gray-100"
                        title="Recentrer"
                    >
                        🎯
                    </button>
                    <div className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 px-2 py-1 rounded border dark:border-gray-600">
                        {visiblePoints.length} Points
                    </div>
                </div>
            </div>
            <div className="flex-1 relative z-0">
                <div ref={mapContainerRef} className="absolute inset-0" style={{ zIndex: 0 }}></div>
            </div>
        </div>
    );
};

export default GeoMap;
