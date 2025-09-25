import React from 'react';
import type { PanelType } from './SlidingPanel';

interface FormSwapperProps {
  activePanel: PanelType | null;
  postFormComponent: React.ReactNode;
  reportFormComponent: React.ReactNode;
  postListComponent: React.ReactNode;
}

const FormSwapper: React.FC<FormSwapperProps> = ({ 
  activePanel,
  postFormComponent,
  reportFormComponent,
  postListComponent 
}) => {
  switch (activePanel) {
    case 'post':
      return <>{postFormComponent}</>;
    case 'report':
      return <>{reportFormComponent}</>;
    case 'list':
      return <>{postListComponent}</>;
    default:
      return null; // Or some default view
  }
};

export default FormSwapper;
