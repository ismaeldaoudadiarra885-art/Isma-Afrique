
import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../hooks/useTranslation';
import IsmaLogo from './IsmaLogo';

const LoginScreen: React.FC = () => {
    const { setUserRole, verifyAdminPassword } = useProject();
    const { addNotification } = useNotification();
    const { t } = useLanguage();
    
    // États
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [accessCode, setAccessCode] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // Nouveau : Toggle visibilité
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    
    // Animation mount
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Reset error on input change
    useEffect(() => {
        setHasError(false);
    }, [accessCode, adminPassword]);

    const handleAccessCodeLogin = async () => {
        if (!accessCode) return;
        setIsLoading(true);
        try {
            await setUserRole(null, accessCode);
            // La redirection se fait automatiquement via le Context
        } catch (error) {
            setHasError(true);
            addNotification(t('login_invalidCode'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdminLogin = async () => {
        if (!adminPassword) return;
        setIsLoading(true);
        
        const isValid = await verifyAdminPassword(adminPassword);

        if (isValid) {
            setUserRole('admin');
            addNotification("Bienvenue, Administrateur.", "success");
        } else {
            setHasError(true);
            addNotification("Mot de passe incorrect.", "error");
            setAdminPassword('');
        }
        setIsLoading(false);
    };

    // Styles globaux pour les animations
    const styles = `
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        @keyframes gradient-xy {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-gradient { 
            background-size: 200% 200%;
            animation: gradient-xy 15s ease infinite;
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        .glass-card {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        }
        .dark .glass-card {
            background: rgba(17, 24, 39, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }
    `;

    return (
        <div className="min-h-screen w-full flex bg-gray-50 dark:bg-gray-900 font-sans overflow-hidden">
            <style>{styles}</style>

            {/* --- PARTIE GAUCHE : VISUEL & BRANDING --- */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden text-white">
                {/* Background animé */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-blue-800 to-indigo-900 animate-gradient"></div>
                
                {/* Formes décoratives */}
                <div className="absolute top-20 left-20 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-40 right-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
                
                {/* Pattern de grille subtil */}
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>

                {/* Contenu Branding */}
                <div className="relative z-10 flex flex-col justify-between p-16 h-full w-full">
                    <div className="flex items-center gap-3">
                        <IsmaLogo className="h-16 w-auto text-5xl" variant="light" />
                    </div>

                    <div className={`space-y-8 transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        <h1 className="text-5xl font-bold leading-tight">
                            Souveraineté des <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">
                                Données Terrain.
                            </span>
                        </h1>
                        <p className="text-lg text-indigo-100 max-w-lg font-light leading-relaxed">
                            Concevez, collectez et analysez en toute sécurité. Une solution robuste pour les ONG et les institutions statistiques.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-indigo-300 font-mono border-t border-white/10 pt-6">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            <span>Chiffré de bout en bout</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>100% Offline</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PARTIE DROITE : FORMULAIRE DE CONNEXION --- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
                <div className={`w-full max-w-md transition-all duration-700 transform ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                    
                    {/* Carte principale */}
                    <div className="glass-card shadow-2xl rounded-2xl overflow-hidden relative">
                        
                        {/* Header Mobile */}
                        <div className="lg:hidden flex items-center justify-center gap-2 pt-8 pb-4 text-indigo-700 dark:text-white">
                            <IsmaLogo className="h-10 w-auto" />
                        </div>

                        {/* Sélecteur de mode (Onglets améliorés) */}
                        <div className="px-8 pt-8">
                            <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl">
                                <button 
                                    onClick={() => { setIsAdminMode(false); setHasError(false); }}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${!isAdminMode ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    Agent Terrain
                                </button>
                                <button 
                                    onClick={() => { setIsAdminMode(true); setHasError(false); }}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${isAdminMode ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    Administrateur
                                </button>
                            </div>
                        </div>

                        <div className="p-8 relative min-h-[300px]">
                            {/* Formulaire Enquêteur */}
                            <div className={`absolute inset-0 px-8 py-4 transition-all duration-500 ease-out transform ${!isAdminMode ? 'translate-x-0 opacity-100 z-10' : '-translate-x-10 opacity-0 z-0 pointer-events-none'}`}>
                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Identification</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        Veuillez saisir votre code d'accréditation unique.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Code d'accès</label>
                                        <div className={`relative group ${hasError ? 'animate-shake' : ''}`}>
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <svg className={`h-5 w-5 transition-colors ${hasError ? 'text-red-500' : 'text-gray-400 group-focus-within:text-indigo-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 19l-1 1-1 1-2-2-2-2-2-2-1 1-1 1 2-2 1-1 1-1 5.743-7.743A6 6 0 0115 7z" /></svg>
                                            </div>
                                            <input 
                                                type="text" 
                                                value={accessCode}
                                                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAccessCodeLogin()}
                                                placeholder="Ex: M-839-XYZ"
                                                className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border rounded-xl text-lg font-mono tracking-widest uppercase outline-none transition-all shadow-inner text-gray-900 dark:text-white ${hasError ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'}`}
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleAccessCodeLogin}
                                        disabled={isLoading || !accessCode}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transform transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : (
                                            <>Valider l'accès <span aria-hidden="true">→</span></>
                                        )}
                                    </button>
                                    
                                    <div className="text-center">
                                        <button onClick={() => alert("Contactez votre administrateur de projet pour récupérer votre code.")} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium underline decoration-indigo-200 underline-offset-2">
                                            Code perdu ou oublié ?
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Formulaire Admin */}
                            <div className={`absolute inset-0 px-8 py-4 transition-all duration-500 ease-out transform ${isAdminMode ? 'translate-x-0 opacity-100 z-10' : 'translate-x-10 opacity-0 z-0 pointer-events-none'}`}>
                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        Accès Sécurisé
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        Réservé à la gestion centrale.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Mot de passe</label>
                                        <div className={`relative group ${hasError ? 'animate-shake' : ''}`}>
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <svg className={`h-5 w-5 transition-colors ${hasError ? 'text-red-500' : 'text-gray-400 group-focus-within:text-red-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 19l-1 1-1 1-2-2-2-2-2-2-1 1-1 1 2-2 1-1 1-1 5.743-7.743A6 6 0 0115 7z" /></svg>
                                            </div>
                                            <input 
                                                type={showPassword ? "text" : "password"}
                                                value={adminPassword}
                                                onChange={(e) => setAdminPassword(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                                                placeholder="Saisissez votre mot de passe"
                                                className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800 border rounded-xl text-lg outline-none transition-all shadow-inner text-gray-900 dark:text-white ${hasError ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-red-500 focus:border-transparent'}`}
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                            >
                                                {showPassword ? (
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                ) : (
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleAdminLogin}
                                        disabled={isLoading || !adminPassword}
                                        className="w-full py-4 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : (
                                            <>Connexion Siège <span aria-hidden="true">🔒</span></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-center mt-8">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Développé par <span className="text-indigo-600 dark:text-indigo-400 font-bold">Ismaël Daouda DIARRA</span>
                        </p>
                        <p className="text-xs text-gray-400 font-mono mt-1 flex justify-center gap-3">
                            <span>📞 83-62-98-31</span>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span>📞 62-76-02-24</span>
                        </p>
                        <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-4">
                            &copy; {new Date().getFullYear()} ISMA Afrique. Usage autorisé uniquement.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
