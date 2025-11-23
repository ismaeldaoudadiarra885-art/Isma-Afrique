import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';

interface BrandingSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BrandingSettingsModal: React.FC<BrandingSettingsModalProps> = ({ isOpen, onClose }) => {
    const { activeProject, updateProject } = useProject();
    const { t } = useLanguage();
    const [logo, setLogo] = useState('');
    const [institutionName, setInstitutionName] = useState('');
    const [ministerialCode, setMinisterialCode] = useState('');
    const [partnerInfo, setPartnerInfo] = useState('');

    useEffect(() => {
        if (activeProject?.institutionalBranding) {
            setLogo(activeProject.institutionalBranding.logo || '');
            setInstitutionName(activeProject.institutionalBranding.institutionName || '');
            setMinisterialCode(activeProject.institutionalBranding.ministerialCode || '');
            setPartnerInfo(activeProject.institutionalBranding.partnerInfo || '');
        }
    }, [activeProject]);

    const handleSave = () => {
        if (!activeProject) return;

        const updatedProject = {
            ...activeProject,
            institutionalBranding: {
                logo: logo || undefined,
                institutionName: institutionName || undefined,
                ministerialCode: ministerialCode || undefined,
                partnerInfo: partnerInfo || undefined,
            }
        };

        updateProject(updatedProject);
        onClose();
    };

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogo(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setLogo('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">{t('branding_title')}</h2>

                <div className="space-y-4">
                    {/* Logo Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('branding_logo')}</label>
                        {logo ? (
                            <div className="flex items-center gap-2">
                                <img src={logo} alt="Logo" className="h-12 w-12 object-contain border rounded" />
                                <button
                                    onClick={handleRemoveLogo}
                                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    {t('branding_logoRemove')}
                                </button>
                            </div>
                        ) : (
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            />
                        )}
                    </div>

                    {/* Institution Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('branding_institutionName')}</label>
                        <input
                            type="text"
                            value={institutionName}
                            onChange={(e) => setInstitutionName(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            placeholder="Ministère de la Santé"
                        />
                    </div>

                    {/* Ministerial Code */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('branding_ministerialCode')}</label>
                        <input
                            type="text"
                            value={ministerialCode}
                            onChange={(e) => setMinisterialCode(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            placeholder="MSP-001"
                        />
                    </div>

                    {/* Partner Info */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('branding_partnerInfo')}</label>
                        <textarea
                            value={partnerInfo}
                            onChange={(e) => setPartnerInfo(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            rows={3}
                            placeholder="Partenaires: UNICEF, OMS"
                        />
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
                        {t('branding_save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BrandingSettingsModal;
