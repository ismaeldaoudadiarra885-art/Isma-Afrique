import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';

interface OnboardingStep {
  title: string;
  description: string;
  image?: string;
}

const OnboardingWizard: React.FC = () => {
  const { t } = useLanguage();
  const { activeProject, setActiveProject } = useProject();
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const steps: OnboardingStep[] = [
    {
      title: t('onboarding.step1.title') || 'Bienvenue dans ISMA Afrique',
      description: t('onboarding.step1.description') || 'Créez votre premier formulaire pour commencer la collecte de données.',
    },
    {
      title: t('onboarding.step2.title') || 'Concevez votre formulaire',
      description: t('onboarding.step2.description') || 'Utilisez le designer pour ajouter des questions, groupes et logique.',
    },
    {
      title: t('onboarding.step3.title') || 'Collectez des données',
      description: t('onboarding.step3.description') || 'Passez en mode collecte pour remplir le formulaire sur le terrain.',
    },
    {
      title: t('onboarding.step4.title') || 'Analysez vos résultats',
      description: t('onboarding.step4.description') || 'Visualisez et analysez vos données avec les outils intégrés.',
    },
  ];

  useEffect(() => {
    if (!localStorage.getItem('onboardingCompleted') && !activeProject) {
      setIsOpen(true);
    }
  }, [activeProject]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('onboardingCompleted', 'true');
      setIsOpen(false);
    }
  };

  const skipOnboarding = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">{steps[currentStep].title}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{steps[currentStep].description}</p>
          {steps[currentStep].image && (
            <img src={steps[currentStep].image} alt={steps[currentStep].title} className="mx-auto mb-4 w-32 h-32" />
          )}
          <div className="flex justify-between items-center">
            <button
              onClick={skipOnboarding}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Ignorer
            </button>
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${index === currentStep ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                />
              ))}
            </div>
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              {currentStep === steps.length - 1 ? 'Commencer' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
