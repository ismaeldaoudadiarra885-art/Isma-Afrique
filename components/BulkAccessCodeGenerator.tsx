import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../hooks/useTranslation';

interface BulkAccessCodeGeneratorProps {
  projectId: string;
  organizationId: string;
}

interface SubmissionWithoutCode {
  id: string;
  submitted_at: string;
  data: any;
  status: string;
}

const BulkAccessCodeGenerator: React.FC<BulkAccessCodeGeneratorProps> = ({
  projectId,
  organizationId
}) => {
  const { addNotification } = useNotification();
  const { t } = useLanguage();

  const [submissions, setSubmissions] = useState<SubmissionWithoutCode[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [generationResults, setGenerationResults] = useState<{
    success: number;
    errors: number;
    codes: { submissionId: string; accessCode: string }[];
  } | null>(null);

  useEffect(() => {
    loadSubmissionsWithoutCodes();
  }, [projectId]);

  const loadSubmissionsWithoutCodes = async () => {
    try {
      const data = await supabaseService.getSubmissionsWithoutAccessCodes(projectId);
      setSubmissions(data);
    } catch (error) {
      addNotification('Erreur lors du chargement des soumissions', 'error');
    }
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.size === submissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(submissions.map(s => s.id)));
    }
  };

  const handleSelectSubmission = (submissionId: string) => {
    const newSelected = new Set(selectedSubmissions);
    if (newSelected.has(submissionId)) {
      newSelected.delete(submissionId);
    } else {
      newSelected.add(submissionId);
    }
    setSelectedSubmissions(newSelected);
  };

  const generateAccessCodes = async () => {
    if (selectedSubmissions.size === 0) {
      addNotification('Veuillez sélectionner au moins une soumission', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const results = await supabaseService.generateAccessCodesForSubmissions(
        Array.from(selectedSubmissions)
      );

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      const generatedCodes = results.filter(r => r.success && r.accessCode);

      setGenerationResults({
        success: successCount,
        errors: errorCount,
        codes: generatedCodes.map(r => ({ submissionId: r.submissionId, accessCode: r.accessCode! }))
      });

      if (successCount > 0) {
        addNotification(`${successCount} codes d'accès générés avec succès`, 'success');
        // Refresh the list
        await loadSubmissionsWithoutCodes();
        setSelectedSubmissions(new Set());
      }

      if (errorCount > 0) {
        addNotification(`${errorCount} erreurs lors de la génération`, 'warning');
      }
    } catch (error) {
      addNotification('Erreur lors de la génération des codes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const exportCodesToCSV = () => {
    if (!generationResults || generationResults.codes.length === 0) {
      addNotification('Aucun code à exporter', 'warning');
      return;
    }

    const csvContent = [
      'ID Soumission,Code d\'accès',
      ...generationResults.codes.map(code => `${code.submissionId},${code.accessCode}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `codes-acces-${projectId}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addNotification('Codes exportés en CSV', 'success');
  };

  const formatSubmissionData = (data: any): string => {
    // Extract key fields for display (customize based on your form structure)
    const keyFields = ['nom', 'prenom', 'name', 'firstname', 'lastname', 'village', 'commune'];
    const displayParts = [];

    for (const field of keyFields) {
      if (data[field]) {
        displayParts.push(`${field}: ${data[field]}`);
      }
    }

    return displayParts.length > 0 ? displayParts.join(', ') : 'Données de soumission';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Génération de codes d'accès en masse
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Sélectionnez les soumissions pour lesquelles vous souhaitez générer des codes d'accès.
        Ces codes permettront aux ménages de consulter et valider leurs données.
      </p>

      {submissions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-2">Toutes les soumissions ont déjà des codes d'accès</p>
        </div>
      ) : (
        <>
          {/* Selection Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedSubmissions.size === submissions.length && submissions.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Tout sélectionner ({selectedSubmissions.size}/{submissions.length})
              </label>
            </div>

            <button
              onClick={generateAccessCodes}
              disabled={isLoading || selectedSubmissions.size === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Génération...' : `Générer ${selectedSubmissions.size} code(s)`}
            </button>
          </div>

          {/* Submissions List */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sélection
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date de soumission
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Données
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.has(submission.id)}
                        onChange={() => handleSelectSubmission(submission.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="max-w-xs truncate">
                        {formatSubmissionData(submission.data)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        submission.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : submission.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {submission.status === 'approved' ? 'Approuvé' :
                         submission.status === 'rejected' ? 'Rejeté' : 'En attente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Generation Results */}
      {generationResults && (
        <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
            Résultats de génération
          </h4>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{generationResults.success}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Réussis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{generationResults.errors}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Échecs</div>
            </div>
          </div>

          {generationResults.codes.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Codes générés ({generationResults.codes.length})
                </h5>
                <button
                  onClick={exportCodesToCSV}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Exporter CSV
                </button>
              </div>

              <div className="max-h-32 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded p-2">
                <div className="grid grid-cols-1 gap-1 text-xs font-mono">
                  {generationResults.codes.map((code, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {code.submissionId.slice(0, 8)}...
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {code.accessCode}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          Comment utiliser les codes d'accès
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>Partagez les codes avec les ménages concernés</li>
          <li>Les ménages peuvent accéder à leurs données via l'interface de retour</li>
          <li>Ils peuvent valider leurs informations et ajouter des commentaires</li>
          <li>Les retours sont automatiquement enregistrés et visibles dans l'application</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkAccessCodeGenerator;
