import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';
import { KoboQuestion } from '../types';

interface CodingRule {
  questionName: string;
  type: 'range' | 'categorical' | 'pattern';
  parameters: any;
  description: string;
}

interface CodingSchema {
  name: string;
  description: string;
  rules: CodingRule[];
}

interface CodingSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CodingSchemaModal: React.FC<CodingSchemaModalProps> = ({ isOpen, onClose }) => {
  const { activeProject, updateProject } = useProject();
  const { t } = useLanguage();
  const [schemas, setSchemas] = useState<CodingSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<CodingSchema | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (activeProject?.codingSchemas) {
      setSchemas(activeProject.codingSchemas);
    }
  }, [activeProject]);

  const handleSaveSchema = (schema: CodingSchema) => {
    const updatedSchemas = selectedSchema
      ? schemas.map(s => s.name === selectedSchema.name ? schema : s)
      : [...schemas, schema];

    setSchemas(updatedSchemas);

    if (activeProject) {
      const updatedProject = {
        ...activeProject,
        codingSchemas: updatedSchemas
      };
      updateProject(updatedProject);
    }

    setSelectedSchema(null);
    setIsEditing(false);
  };

  const handleDeleteSchema = (schemaName: string) => {
    const updatedSchemas = schemas.filter(s => s.name !== schemaName);
    setSchemas(updatedSchemas);

    if (activeProject) {
      const updatedProject = {
        ...activeProject,
        codingSchemas: updatedSchemas
      };
      updateProject(updatedProject);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Schémas de Codification</h2>

        <div className="space-y-4">
          {/* Schema List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemas.map(schema => (
              <div key={schema.name} className="border rounded-lg p-4">
                <h3 className="font-semibold">{schema.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{schema.description}</p>
                <p className="text-xs text-gray-500">{schema.rules.length} règles</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setSelectedSchema(schema);
                      setIsEditing(true);
                    }}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteSchema(schema.name)}
                    className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Schema Button */}
          <button
            onClick={() => {
              setSelectedSchema(null);
              setIsEditing(true);
            }}
            className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500"
          >
            + Nouveau Schéma de Codification
          </button>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Schema Editor Modal */}
      {isEditing && (
        <SchemaEditorModal
          schema={selectedSchema}
          onSave={handleSaveSchema}
          onClose={() => {
            setIsEditing(false);
            setSelectedSchema(null);
          }}
        />
      )}
    </div>
  );
};

interface SchemaEditorModalProps {
  schema: CodingSchema | null;
  onSave: (schema: CodingSchema) => void;
  onClose: () => void;
}

const SchemaEditorModal: React.FC<SchemaEditorModalProps> = ({ schema, onSave, onClose }) => {
  const [name, setName] = useState(schema?.name || '');
  const [description, setDescription] = useState(schema?.description || '');
  const [rules, setRules] = useState<CodingRule[]>(schema?.rules || []);

  const handleAddRule = () => {
    setRules([...rules, {
      questionName: '',
      type: 'range',
      parameters: {},
      description: ''
    }]);
  };

  const handleUpdateRule = (index: number, rule: CodingRule) => {
    const updatedRules = [...rules];
    updatedRules[index] = rule;
    setRules(updatedRules);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      rules
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">
          {schema ? 'Modifier le Schéma' : 'Nouveau Schéma'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom du schéma</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="Ex: Codification Santé"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              rows={3}
              placeholder="Description du schéma de codification..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Règles de codification</label>
              <button
                onClick={handleAddRule}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                + Ajouter Règle
              </button>
            </div>

            <div className="space-y-2">
              {rules.map((rule, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Nom de la question"
                      value={rule.questionName}
                      onChange={(e) => handleUpdateRule(index, { ...rule, questionName: e.target.value })}
                      className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <select
                      value={rule.type}
                      onChange={(e) => handleUpdateRule(index, { ...rule, type: e.target.value as any })}
                      className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="range">Plage</option>
                      <option value="categorical">Catégoriel</option>
                      <option value="pattern">Motif</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Description"
                      value={rule.description}
                      onChange={(e) => handleUpdateRule(index, { ...rule, description: e.target.value })}
                      className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  {/* Rule-specific parameters */}
                  {rule.type === 'range' && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={rule.parameters.min || ''}
                        onChange={(e) => handleUpdateRule(index, {
                          ...rule,
                          parameters: { ...rule.parameters, min: parseFloat(e.target.value) }
                        })}
                        className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={rule.parameters.max || ''}
                        onChange={(e) => handleUpdateRule(index, {
                          ...rule,
                          parameters: { ...rule.parameters, max: parseFloat(e.target.value) }
                        })}
                        className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => handleRemoveRule(index)}
                    className="mt-2 px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodingSchemaModal;
