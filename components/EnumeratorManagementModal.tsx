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
    const { activeProject, addManagedUser, deleteManagedUser } = useProject();
    const { addNotification } = useNotification();
    const { t } = useLanguage();
    
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('enumerator');

    if (!isOpen || !activeProject) return null;

    const users = activeProject.managedUsers || [];

    const handleAddUser = () => {
        if (!newName.trim()) return;
        
        addManagedUser({
            name: newName,
            role: newRole,
        });
        setNewName('');
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            addNotification(t('userManagement_codeCopied'), "success");
        }).catch(err => {
            addNotification("Erreur lors de la copie.", "error");
        });
    };

    const roles: { id: UserRole, name: string }[] = [
        { id: 'enumerator', name: t('roleEnumerator') },
        { id: 'project_manager', name: t('roleManager') },
    ];
    
    const roleNameMap: { [key in UserRole]: string } = {
        'admin': t('roleAdmin'),
        'project_manager': t('roleManager'),
        'enumerator': t('roleEnumerator'),
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold">{t('userManagement_title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <div className="p-4 border-b dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {t('userManagement_description')}
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={t('userManagement_namePlaceholder')}
                            className="flex-grow block text-sm rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"
                        />
                         <select 
                            value={newRole} 
                            onChange={e => setNewRole(e.target.value as UserRole)}
                            className="text-sm rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"
                        >
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <button onClick={handleAddUser} className="px-4 py-2 text-sm font-medium text-white bg-isma-blue rounded-md hover:bg-isma-blue-dark">{t('userManagement_add')}</button>
                    </div>
                </div>
                <main className="flex-1 overflow-y-auto p-4 space-y-3">
                    {users.length > 0 ? (
                        users.map((user: ManagedUser) => (
                            <div key={user.id} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{user.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Rôle: {roleNameMap[user.role] || user.role}</p>
                                    <p className="text-sm font-mono text-isma-blue dark:text-isma-blue-light mt-1">{user.accessCode}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <button onClick={() => deleteManagedUser(user.id)} className="text-red-500 hover:text-red-700 text-xs">Supprimer</button>
                                     <button onClick={() => copyToClipboard(user.accessCode)} className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">{t('userManagement_copyLink')}</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-6">{t('userManagement_noUsers')}</p>
                    )}
                </main>
                 <footer className="p-4 border-t dark:border-gray-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-isma-blue rounded-md hover:bg-isma-blue-dark">
                        Fermer
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default UserManagementModal;