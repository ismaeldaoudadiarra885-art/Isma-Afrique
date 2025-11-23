import React from 'react';

const Glossary: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Glossaire</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Cette section contiendra des définitions des termes techniques utilisés dans l'application.
      </p>
    </div>
  );
};

export default Glossary;
