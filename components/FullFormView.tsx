
import React from 'react';
import DataView from './DataView';

const FullFormView: React.FC = () => {
  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto">
        <DataView />
      </div>
    </div>
  );
};

export default FullFormView;
