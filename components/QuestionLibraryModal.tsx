import React, { useState, useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { getLocalizedText } from '../utils/localizationUtils';
import { KoboQuestion } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { questionBank } from '../data/questionBank';

interface QuestionLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuestionLibraryModal: React.FC<QuestionLibraryModalProps> = ({ isOpen, onClose }) => {
  const {
    activeProject,
    currentQuestionName,
    questionLibrary,
    questionModules,
    saveQuestionToLibrary,
    deleteQuestionFromLibrary,
    addQuestion,
    addModuleToForm,
    deleteModule
  } = useProject();
  const { addNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState<'bank' | 'user' | 'modules'>('bank');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen || !activeProject) return null;

  const currentQuestion = activeProject.formData.survey.find(q => q.name === currentQuestionName);
  const defaultLang = activeProject.formData.settings.default_language || 'default';

  const handleSave = () => {
    if (currentQuestion) {
      if (questionLibrary.some(q => q.uid === currentQuestion.uid)) {
        addNotification(`Cette question est déjà dans votre bibliothèque.`, 'info');
      } else {
        saveQuestionToLibrary(currentQuestion);
        addNotification(`Question "${getLocalizedText(currentQuestion.label, defaultLang)}" sauvegardée !`, 'success');
      }
    }
  };

  const handleAddFromLibrary = (question: any) => {
    const newQuestion = {
        ...question,
        uid: uuidv4(),
        choices: question.choices?.map((c: any) => ({ ...c, uid: uuidv4() }))
    };
    addQuestion(newQuestion);
    addNotification(`Question "${getLocalizedText(question.label, defaultLang)}" ajoutée au formulaire.`, 'success');
  };

  const handleDeleteFromLibrary = (question: KoboQuestion) => {
    deleteQuestionFromLibrary(question.uid);
    addNotification(`Question "${getLocalizedText(question.label, defaultLang)}" supprimée de la bibliothèque.`, 'info');
  };

  const bankCategories = useMemo(() => ['all', ...Array.from(new Set(questionBank.map(c => c.category)))], []);
  
  const filteredBank = useMemo(() => {
    return questionBank
      .map(category => ({
        ...category,
        questions: category.questions.filter(q =>
          getLocalizedText(q.label, defaultLang).toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter(category => category.questions.length > 0 && (selectedCategory === 'all' || category.category === selectedCategory));
  }, [searchTerm, selectedCategory, defaultLang]);
  
  const filteredUserQuestions = useMemo(() => {
      return questionLibrary.filter(q => getLocalizedText(q.label, defaultLang).toLowerCase().includes(searchTerm.toLowerCase()));
  }, [questionLibrary, searchTerm, defaultLang]);

  const filteredModules = useMemo(() => {
      return questionModules.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [questionModules, searchTerm]);
  
  const TabButton: React.FC<{ tabId: 'bank' | 'user' | 'modules', children: React.ReactNode }> = ({ tabId, children }) => (
    <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === tabId ? 'border-isma-blue text-isma-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Bibliothèque de Questions</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <nav className="border-b dark:border-gray-700 px-4">
          <div className="flex space-x-2">
            <TabButton tabId="bank">Banque de Questions</TabButton>
            <TabButton tabId="user">Mes Questions ({questionLibrary.length})</TabButton>
            <TabButton tabId="modules">Modules ({questionModules.length})</TabButton>
          </div>
        </nav>
        
        <div className="p-4 border-b dark:border-gray-700">
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full text-sm rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-600 focus:border-isma-blue focus:ring-isma-blue"/>
            {activeTab === 'bank' && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {bankCategories.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-2 py-1 text-xs rounded-full ${selectedCategory === cat ? 'bg-isma-blue text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                            {cat === 'all' ? 'Toutes' : cat}
                        </button>
                    ))}
                </div>
            )}
        </div>

        <main className="flex-1 p-4 overflow-y-auto space-y-4">
          {activeTab === 'bank' && (
            filteredBank.length > 0 ? filteredBank.map(category => (
                <div key={category.category}>
                    <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">{category.category}</h3>
                    <div className="space-y-2">
                        {category.questions.map(q => (
                             <div key={q.name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                                <div className="truncate">
                                    <p className="text-sm font-medium">{getLocalizedText(q.label, defaultLang)}</p>
                                    <p className="text-xs text-gray-500 font-mono">{q.name} ({q.type})</p>
                                </div>
                                <button onClick={() => handleAddFromLibrary(q)} className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex-shrink-0 ml-2">Ajouter au formulaire</button>
                            </div>
                        ))}
                    </div>
                </div>
            )) : <p className="text-center text-gray-500 py-4">Aucune question trouvée.</p>
          )}

          {activeTab === 'user' && (
             <div className="space-y-2">
                <div className="mb-4">
                  {currentQuestion ? (
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/50 rounded-md">
                      <p className="text-sm truncate">
                        Sélectionné: <span className="font-semibold">{getLocalizedText(currentQuestion.label, defaultLang)}</span>
                      </p>
                      <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-isma-blue rounded-md hover:bg-isma-blue-dark">Sauvegarder</button>
                    </div>
                  ) : (
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">Sélectionnez une question dans le designer pour la sauvegarder.</p>
                  )}
                </div>
                {filteredUserQuestions.length > 0 ? filteredUserQuestions.map(q => (
                  <div key={q.uid} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="truncate">
                        <p className="text-sm font-medium">{getLocalizedText(q.label, defaultLang)}</p>
                        <p className="text-xs text-gray-500 font-mono">{q.name} ({q.type})</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <button onClick={() => handleDeleteFromLibrary(q)} className="text-xs text-red-500 hover:underline">Supprimer</button>
                        <button onClick={() => handleAddFromLibrary(q)} className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Ajouter</button>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-4">Votre bibliothèque est vide ou ne correspond pas à la recherche.</p>
                )}
             </div>
          )}

          {activeTab === 'modules' && (
             <div className="space-y-2">
                {filteredModules.length > 0 ? filteredModules.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="truncate">
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <button onClick={() => deleteModule(m.id)} className="text-xs text-red-500 hover:underline">Supprimer</button>
                        <button onClick={() => addModuleToForm(m.id)} className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Ajouter</button>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-4">Aucun module sauvegardé.</p>
                )}
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default QuestionLibraryModal;