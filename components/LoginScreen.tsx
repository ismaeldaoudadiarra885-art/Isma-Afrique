
import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../hooks/useTranslation';

const LoginScreen: React.FC = () => {
    const { setUserRole } = useProject();
    const { addNotification } = useNotification();
    const { t } = useLanguage();
    const [accessCode, setAccessCode] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAccessCodeLogin = async () => {
        if (!accessCode) return;
        setIsLoading(true);
        try {
            await setUserRole(null, accessCode);
            // Si la fonction réussit, le changement de rôle dans le contexte déclenchera le re-rendu de App.tsx
        } catch (error) {
            addNotification(t('login_invalidCode'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdminLogin = async () => {
        if (!adminPassword || adminPassword !== 'admin') {
            addNotification('Mot de passe administrateur incorrect.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await setUserRole('super_admin');
        } catch (error) {
            addNotification('Erreur lors de la connexion administrateur.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-white-off dark:bg-gray-900 p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                <div className="flex justify-center mb-6">
                    <img
                        src="/ISMA.png"
                        alt="ISMA Afrique Logo"
                        className="h-12 sm:h-16 md:h-20 w-auto drop-shadow-lg hover:scale-105 transition-transform duration-300"
                    />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-center text-anthracite-gray dark:text-gray-100 drop-shadow-sm">{t('login_title')}</h1>
                <p className="text-center text-gray-600 dark:text-gray-300 mt-3 mb-8 text-sm sm:text-base leading-relaxed">{t('login_subtitle')}</p>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold">{t('login_accessForEnumerators')}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{t('login_enterAccessCode')}</p>
                        <div className="flex gap-2 mt-3">
                            <input
                                type="text"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAccessCodeLogin()}
                                placeholder={t('login_accessCodePlaceholder')}
                                className="flex-grow block text-sm rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"
                                disabled={isLoading}
                            />
                            <button onClick={handleAccessCodeLogin} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md disabled:opacity-50 hover:bg-indigo-deep-light transition-colors duration-200">
                                {isLoading ? '...' : t('login_validate')}
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">OU</span>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold">{t('login_adminAccess')}</h2>
                        <div className="mt-3 space-y-2">
                            <input
                                type="password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                                placeholder="Mot de passe administrateur"
                                className="w-full block text-sm rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleAdminLogin}
                                disabled={isLoading || !adminPassword}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md disabled:opacity-50 hover:bg-indigo-deep-light transition-colors duration-200"
                            >
                                {isLoading ? '...' : t('login_continueAsAdmin')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;