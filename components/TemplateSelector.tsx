import React, { useState } from 'react';
import { FormTemplate, StandardModule } from '../types';
import { formTemplatesService } from '../services/formTemplatesService';
import { getLocalizedText } from '../utils/localizationUtils';

interface TemplateSelectorProps {
    onTemplateSelect: (template: FormTemplate) => void;
    onModuleSelect: (modules: StandardModule[]) => void;
    onCustomCreate: () => void;
    onClose: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    onTemplateSelect,
    onModuleSelect,
    onCustomCreate,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<'templates' | 'modules'>('templates');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedModules, setSelectedModules] = useState<StandardModule[]>([]);

    const templates = formTemplatesService.getTemplates();
    const modules = formTemplatesService.getStandardModules();

    const categories = [
        { id: 'all', name: 'Tous', icon: '📋' },
        { id: 'humanitarian', name: 'Humanitaire', icon: '🏥' },
        { id: 'education', name: 'Éducation', icon: '📚' },
        { id: 'sustainable_development', name: 'Développement Durable', icon: '🌱' },
        { id: 'health', name: 'Santé', icon: '⚕️' },
        { id: 'agriculture', name: 'Agriculture', icon: '🌾' }
    ];

    const filteredTemplates = selectedCategory === 'all'
        ? templates
        : templates.filter(t => t.category === selectedCategory);

    const moduleCategories = [
        { id: 'all', name: 'Tous' },
        { id: 'demographics', name: 'Démographie' },
        { id: 'living_conditions', name: 'Conditions de Vie' },
        { id: 'economic', name: 'Économique' },
        { id: 'food_security', name: 'Sécurité Alimentaire' },
        { id: 'protection', name: 'Protection' },
        { id: 'education', name: 'Éducation' }
    ];

    const filteredModules = selectedCategory === 'all'
        ? modules
        : modules.filter(m => m.category === selectedCategory);

    const handleModuleToggle = (module: StandardModule) => {
        setSelectedModules(prev =>
            prev.find(m => m.id === module.id)
                ? prev.filter(m => m.id !== module.id)
                : [...prev, module]
        );
    };

    const handleModuleConfirm = () => {
        onModuleSelect(selectedModules);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Créer un Nouveau Formulaire
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`flex-1 py-3 px-6 text-center font-medium ${
                            activeTab === 'templates'
                                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        Modèles Prédéfinis
                    </button>
                    <button
                        onClick={() => setActiveTab('modules')}
                        className={`flex-1 py-3 px-6 text-center font-medium ${
                            activeTab === 'modules'
                                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                        Modules Standards
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-96">
                    {activeTab === 'templates' ? (
                        <>
                            {/* Category Filter */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {categories.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            selectedCategory === category.id
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <span className="mr-2">{category.icon}</span>
                                        {category.name}
                                    </button>
                                ))}
                            </div>

                            {/* Templates Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTemplates.map(template => (
                                    <div
                                        key={template.id}
                                        onClick={() => onTemplateSelect(template)}
                                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center mb-3">
                                            <span className="text-2xl mr-3">{template.icon}</span>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {template.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                    {template.category.replace('_', ' ')}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                            {template.description}
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {template.modules.slice(0, 3).map(moduleId => {
                                                const module = formTemplatesService.getModuleById(moduleId);
                                                return module ? (
                                                    <span
                                                        key={moduleId}
                                                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-700 dark:text-gray-300"
                                                    >
                                                        {module.name}
                                                    </span>
                                                ) : null;
                                            })}
                                            {template.modules.length > 3 && (
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-700 dark:text-gray-300">
                                                    +{template.modules.length - 3} autres
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Module Category Filter */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {moduleCategories.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            selectedCategory === category.id
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>

                            {/* Modules List */}
                            <div className="space-y-3">
                                {filteredModules.map(module => (
                                    <div
                                        key={module.id}
                                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                                    {module.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                    {module.description}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-700 dark:text-gray-300 capitalize">
                                                        {module.category.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {module.questions.length} questions
                                                    </span>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={selectedModules.some(m => m.id === module.id)}
                                                onChange={() => handleModuleToggle(module)}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onCustomCreate}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Créer Personnalisé
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Annuler
                        </button>

                        {activeTab === 'modules' && selectedModules.length > 0 && (
                            <button
                                onClick={handleModuleConfirm}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Créer avec {selectedModules.length} module{selectedModules.length > 1 ? 's' : ''}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateSelector;
