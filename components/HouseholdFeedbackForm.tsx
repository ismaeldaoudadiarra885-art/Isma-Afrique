import React, { useState } from 'react';
import { supabaseService, Submission } from '../services/supabaseClient';

interface HouseholdFeedbackFormProps {
  submission: Submission;
  onBack: () => void;
  onSuccess: () => void;
}

const HouseholdFeedbackForm: React.FC<HouseholdFeedbackFormProps> = ({
  submission,
  onBack,
  onSuccess
}) => {
  const [comment, setComment] = useState('');
  const [validation, setValidation] = useState<boolean | null>(submission.household_validated ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Add comment if provided
      if (comment.trim()) {
        await supabaseService.addHouseholdComment(submission.id, comment.trim());
      }

      // Update validation status if changed
      if (validation !== submission.household_validated) {
        await supabaseService.validateHouseholdSubmission(submission.id, validation!);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi du retour');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = comment.trim() || validation !== submission.household_validated;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Fournir un retour sur vos données
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Vos commentaires nous aideront à améliorer la qualité des données
                </p>
              </div>
              <button
                onClick={onBack}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Retour
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Validation Section */}
              <div>
                <fieldset>
                  <legend className="text-sm font-medium text-gray-900">
                    Ces données correspondent-elles à votre situation ?
                  </legend>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center">
                      <input
                        id="validation-yes"
                        name="validation"
                        type="radio"
                        checked={validation === true}
                        onChange={() => setValidation(true)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <label htmlFor="validation-yes" className="ml-3 block text-sm font-medium text-gray-700">
                        Oui, ces données sont correctes
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="validation-no"
                        name="validation"
                        type="radio"
                        checked={validation === false}
                        onChange={() => setValidation(false)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <label htmlFor="validation-no" className="ml-3 block text-sm font-medium text-gray-700">
                        Non, il y a des erreurs
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>

              {/* Comments Section */}
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                  Commentaires additionnels (optionnel)
                </label>
                <div className="mt-1">
                  <textarea
                    id="comment"
                    name="comment"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ajoutez vos commentaires, corrections ou préoccupations concernant ces données..."
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Vos commentaires seront ajoutés à l'historique et visibles par l'équipe de collecte
                </p>
              </div>

              {/* Previous Comments Display */}
              {submission.household_comments && submission.household_comments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Vos commentaires précédents</h4>
                  <div className="space-y-3">
                    {submission.household_comments.map((prevComment, index) => (
                      <div key={index} className="bg-gray-50 rounded-md p-3">
                        <p className="text-sm text-gray-700">{prevComment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || !hasChanges}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le retour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseholdFeedbackForm;
