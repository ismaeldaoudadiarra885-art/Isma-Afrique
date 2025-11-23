
import React from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';

const RealtimeCoach: React.FC = () => {
  const { isRealtimeCoachEnabled, setRealtimeCoachEnabled, realtimeFeedback, currentQuestionName } = useProject();
  const { t } = useLanguage();

  const currentFeedback = currentQuestionName ? realtimeFeedback[currentQuestionName] : null;

  return (
    <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-3">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold">{t('realtimeCoach_title')}</h4>
        <div className="flex items-center">
            <span className="text-xs mr-2">{isRealtimeCoachEnabled ? 'Activé' : 'Désactivé'}</span>
            <button
                onClick={() => setRealtimeCoachEnabled(!isRealtimeCoachEnabled)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                    isRealtimeCoachEnabled ? 'bg-isma-blue' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    isRealtimeCoachEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
            </button>
        </div>
      </div>
      {isRealtimeCoachEnabled && (
         <div className="text-xs text-gray-600 dark:text-gray-300 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md min-h-[40px]">
             {currentFeedback ? (
                <p>
                    <span className={currentFeedback.status === 'warning' ? 'font-bold text-yellow-600' : ''}>
                        {currentFeedback.message}
                    </span>
                </p>
             ) : (
                <p className="italic text-gray-400">{t('realtimeCoach_description')}</p>
             )}
         </div>
      )}
    </div>
  );
};

export default RealtimeCoach;
