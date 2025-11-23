import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';

interface RegionalSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RegionalSettingsModal: React.FC<RegionalSettingsModalProps> = ({ isOpen, onClose }) => {
    const { activeProject, updateProject } = useProject();
    const { t } = useLanguage();
    const [region, setRegion] = useState('');
    const [culturalContext, setCulturalContext] = useState('');
    const [localTerms, setLocalTerms] = useState('');

    useEffect(() => {
        if (activeProject?.regionalSettings) {
            setRegion(activeProject.regionalSettings.region || '');
            setCulturalContext(activeProject.regionalSettings.culturalContext || '');
            setLocalTerms(activeProject.regionalSettings.localTerms?.join(', ') || '');
        }
    }, [activeProject]);

    const handleSave = () => {
        if (!activeProject) return;

        const updatedProject = {
            ...activeProject,
            regionalSettings: {
                region: region || undefined,
                culturalContext: culturalContext || undefined,
                localTerms: localTerms ? localTerms.split(',').map(term => term.trim()) : undefined,
            }
        };

        updateProject(updatedProject);
        onClose();
    };

    const regions = [
        'region_bamako',
        'region_sikasso',
        'region_segou',
        'region_mopti',
        'region_tombouctou',
        'region_gao',
        'region_kayes',
        'region_koulikoro'
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">{t('regional_title')}</h2>

                <div className="space-y-4">
                    {/* Region Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('regional_region')}</label>
                        <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="">{t('regional_region')}</option>
                            {regions.map(regionKey => (
                                <option key={regionKey} value={regionKey}>
                                    {t(regionKey)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Cultural Context */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('regional_culturalContext')}</label>
                        <textarea
                            value={culturalContext}
                            onChange={(e) => setCulturalContext(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            rows={3}
                            placeholder="Contexte culturel spécifique à la région..."
                        />
                    </div>

                    {/* Local Terms */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('regional_localTerms')}</label>
                        <textarea
                            value={localTerms}
                            onChange={(e) => setLocalTerms(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            rows={2}
                            placeholder="termes locaux, séparés par des virgules"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Séparez les termes par des virgules (ex: dɔgɔtɔrɔso, dugutigi, sɔgɔma)
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegionalSettingsModal;
