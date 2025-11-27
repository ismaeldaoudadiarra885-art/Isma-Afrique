
import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { UserRole, ManagedUser } from '../types';
import { useLanguage } from '../hooks/useTranslation';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
    const { activeProject, addManagedUser } = useProject();
    const { addNotification } = useNotification();
    const { t } = useLanguage();
    
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [organization, setOrganization] = useState('');
    const [email, setEmail] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('enumerator');
    
    // Gestion des étapes : 'input' (saisie) -> 'success' (affichage code & envoi)
    const [creationStep, setCreationStep] = useState<'input' | 'success'>('input');
    const [createdUser, setCreatedUser] = useState<{name: string, firstName: string, lastName: string, organization: string, code: string, email: string, role: UserRole} | null>(null);

    if (!isOpen || !activeProject) return null;

    const handleGenerateCode = () => {
        if (!firstName.trim() || !lastName.trim()) {
            addNotification("Le prénom et le nom sont obligatoires pour créer le badge.", "warning");
            return;
        }
        
        // 1. Génération du code via le contexte
        const generatedCode = addManagedUser({
            firstName: firstName,
            lastName: lastName,
            email: email,
            organization: organization,
            role: newRole,
        });

        // 2. Stockage des infos pour l'étape suivante
        setCreatedUser({
            name: `${firstName} ${lastName}`,
            firstName,
            lastName,
            organization,
            role: newRole,
            code: generatedCode,
            email: email
        });

        // 3. Passage à l'étape de succès/envoi
        setCreationStep('success');
        addNotification("Accès généré avec succès !", 'success');
    };
    
    const handleSendEmail = () => {
        if (!createdUser) return;
        
        const projectName = activeProject.name;
        const subject = `Ordre de Mission - ${projectName}`;
        const body = `Bonjour ${createdUser.firstName},

Voici vos identifiants pour l'application ISMA :

PROJET : ${projectName}
VOTRE CODE : ${createdUser.code}

Instructions :
1. Ouvrez l'application.
2. Sélectionnez "Accès Enquêteur".
3. Entrez le code ci-dessus.

Bonne collecte.`;

        // Construction du lien mailto
        const mailtoLink = `mailto:${createdUser.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Tentative d'ouverture robuste
        try {
            const opened = window.open(mailtoLink, '_blank');
            if (!opened) {
                // Si le popup blocker bloque ou pas de client mail
                window.location.href = mailtoLink;
            }
            addNotification("Client mail ouvert. Si rien ne se passe, utilisez le bouton 'Copier'.", "info");
        } catch (e) {
            handleCopyInvitation();
            addNotification("Impossible d'ouvrir le mail. Les infos ont été copiées dans le presse-papier.", "warning");
        }
    };

    const handleCopyInvitation = () => {
        if (!createdUser) return;
        const projectName = activeProject.name;
        const text = `*Accréditation ISMA*\nProjet : ${projectName}\nAgent : ${createdUser.firstName} ${createdUser.lastName}\nCode d'accès : ${createdUser.code}`;
        
        navigator.clipboard.writeText(text);
        addNotification("Infos copiées dans le presse-papier !", 'success');
    };

    const handleReset = () => {
        setFirstName('');
        setLastName('');
        setOrganization('');
        setEmail('');
        setCreatedUser(null);
        setCreationStep('input');
    };

    const inputClass = "mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-deep focus:ring-indigo-deep dark:bg-gray-700 dark:border-gray-600 p-2 border";
    const labelClass = "block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
                
                {/* En-tête */}
                <div className="flex justify-between items-center p-5 border-b dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                            {creationStep === 'input' ? 'Nouvelle Accréditation' : 'Badge d\'Accès Généré'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {creationStep === 'input' ? 'Remplissez les infos de l\'agent' : 'Transmettez ce code à l\'agent'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6">
                    {creationStep === 'input' ? (
                        /* --- ÉTAPE 1 : FORMULAIRE --- */
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Prénom *</label>
                                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} placeholder="Ex: Moussa" />
                                </div>
                                <div>
                                    <label className={labelClass}>Nom *</label>
                                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} placeholder="Ex: Diarra" />
                                </div>
                            </div>
                            
                            <div>
                                <label className={labelClass}>Organisation / Structure</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🏢</span>
                                    <input type="text" value={organization} onChange={e => setOrganization(e.target.value)} className={`${inputClass} pl-9`} placeholder="Ex: Croix-Rouge, ONG locale..." />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Email (Optionnel)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">@</span>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={`${inputClass} pl-9`} placeholder="Pour envoyer le code..." />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Rôle & Permissions</label>
                                <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)} className={inputClass}>
                                    <option value="enumerator">Enquêteur (Collecte uniquement)</option>
                                    <option value="project_manager">Chef de Projet (Peut modifier le formulaire)</option>
                                </select>
                            </div>

                            <div className="pt-2">
                                <button 
                                    onClick={handleGenerateCode} 
                                    className="w-full py-3 px-4 bg-indigo-deep hover:bg-indigo-deep-dark text-white font-bold rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-95 flex justify-center items-center gap-2"
                                >
                                    <span>Générer le Badge d'Accès</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* --- ÉTAPE 2 : CARTE D'IDENTITÉ VIRTUELLE --- */
                        <div className="flex flex-col items-center space-y-6 animate-fadeIn">
                            
                            {/* Carte Badge */}
                            <div className="w-full bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden relative">
                                {/* Bandeau haut */}
                                <div className="h-24 bg-gradient-to-r from-indigo-600 to-blue-500 relative">
                                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white/10 backdrop-blur-sm"></div>
                                    <div className="absolute top-4 right-4 text-white/80 text-xs font-mono border border-white/30 px-2 py-0.5 rounded">
                                        OFFICIEL
                                    </div>
                                </div>
                                
                                {/* Photo & Infos */}
                                <div className="px-6 pb-6 relative">
                                    <div className="-mt-12 mb-4 flex justify-between items-end">
                                        <div className="h-24 w-24 rounded-xl border-4 border-white shadow-md bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-400">
                                            {(createdUser?.firstName || 'A').charAt(0)}
                                        </div>
                                        <div className="text-right mb-1">
                                            <p className="text-xs text-gray-400 uppercase font-bold">Rôle</p>
                                            <p className="text-sm font-bold text-indigo-600">{createdUser?.role === 'project_manager' ? 'MANAGER' : 'ENQUÊTEUR'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-bold text-gray-800 uppercase leading-none">
                                            {createdUser?.lastName}
                                        </h3>
                                        <p className="text-lg text-gray-600">{createdUser?.firstName}</p>
                                        <p className="text-sm text-gray-400 pt-2 flex items-center gap-1">
                                            <span>🏢</span> {createdUser?.organization || 'Non affilié'}
                                        </p>
                                    </div>

                                    {/* Zone Code */}
                                    <div className="mt-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center relative group cursor-pointer hover:bg-indigo-50 transition-colors" onClick={handleCopyInvitation}>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">CODE D'ACCÈS UNIQUE</p>
                                        <p className="text-3xl font-mono font-black text-gray-800 tracking-widest selection:bg-indigo-200">
                                            {createdUser?.code}
                                        </p>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">Copier</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button 
                                    onClick={handleSendEmail}
                                    className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    <span>📧</span> Envoyer par Mail
                                </button>
                                <button 
                                    onClick={handleCopyInvitation}
                                    className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <span>📋</span> Copier Infos
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                    {creationStep === 'success' ? (
                        <>
                            <button onClick={handleReset} className="text-sm text-indigo-600 font-semibold hover:underline">
                                + Nouveau Badge
                            </button>
                            <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors">
                                Terminer
                            </button>
                        </>
                    ) : (
                        <button onClick={onClose} className="ml-auto px-5 py-2 text-gray-500 hover:text-gray-800 text-sm font-medium">
                            Annuler
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagementModal;
