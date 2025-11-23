import React, { useState } from 'react';
import { supabaseService, Submission } from '../services/supabaseClient';
import { validateAccessCode, formatAccessCode } from '../utils/accessCodeUtils';
import HouseholdFeedbackForm from './HouseholdFeedbackForm';

const HouseholdFeedbackScreen: React.FC = () => {
  const [accessCode, setAccessCode] = useState('');
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'enter-code' | 'view-submission' | 'provide-feedback'>('enter-code');

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate format first
      if (!validateAccessCode(accessCode.replace('-', ''))) {
        throw new Error('Format de code invalide. Utilisez 8 caractères alphanumériques.');
      }

      const cleanCode = accessCode.replace('-', '').toUpperCase();
      const data = await supabaseService.getSubmissionByAccessCode(cleanCode);
      setSubmission(data);
      setStep('view-submission');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCodeChange = (value: string) => {
    // Auto-format as XXXX-XXXX
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (clean.length <= 8) {
      setAccessCode(clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean);
    }
  };

  const handleProvideFeedback = () => {
    setStep('provide-feedback');
  };

  const handleBackToSubmission = () => {
    setStep('view-submission');
  };

  const handleNewSearch = () => {
    setAccessCode('');
    setSubmission(null);
    setStep('enter-code');
    setError('');
  };

  if (step === 'enter-code') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Accès à vos données
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Entrez votre code d'accès pour consulter et valider vos données
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={handleAccessCodeSubmit} className="space-y-6">
              <div>
                <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700">
                  Code d'accès
                </label>
                <div className="mt-1">
                  <input
                    id="accessCode"
                    name="accessCode"
                    type="text"
                    placeholder="XXXX-XXXX"
                    value={accessCode}
                    onChange={(e) => handleAccessCodeChange(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    maxLength={9} // 8 chars + hyphen
                    required
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Code de 8 caractères fourni par l'enquêteur
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading || accessCode.replace('-', '').length !== 8}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Chargement...' : 'Accéder à mes données'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'view-submission' && submission) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Vos données de collecte
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={handleNewSearch}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Nouveau code
                </button>
              </div>

              <div className="mt-6 border-t border-gray-200">
                <dl className="divide-y divide-gray-200">
                  {Object.entries(submission.data || {}).map(([key, value]) => (
                    <div key={key} className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm font-medium text-gray-500 capitalize">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {submission.household_comments && submission.household_comments.length > 0 && (
                <div className="mt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Vos commentaires précédents</h4>
                  <div className="space-y-3">
                    {submission.household_comments.map((comment, index) => (
                      <div key={index} className="bg-gray-50 rounded-md p-3">
                        <p className="text-sm text-gray-700">{comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleProvideFeedback}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {submission.household_comments?.length ? 'Ajouter un commentaire' : 'Fournir un retour'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'provide-feedback' && submission) {
    return (
      <HouseholdFeedbackForm
        submission={submission}
        onBack={handleBackToSubmission}
        onSuccess={() => {
          // Refresh submission data
          supabaseService.getSubmissionByAccessCode(submission.access_code!)
            .then(setSubmission)
            .then(() => setStep('view-submission'));
        }}
      />
    );
  }

  return null;
};

export default HouseholdFeedbackScreen;
