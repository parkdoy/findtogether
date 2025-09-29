import React from 'react';
import type { PanelType } from './SlidingPanel';

interface FormSwapperProps {
  activePanel: PanelType | null;
  postFormComponent: React.ReactNode;
  reportFormComponent: React.ReactNode;
  postListComponent: React.ReactNode;
  myPageComponent: React.ReactNode;
}

const FormSwapper: React.FC<FormSwapperProps> = ({ 
  activePanel,
  postFormComponent,
  reportFormComponent,
  postListComponent,
  myPageComponent
}) => {
  switch (activePanel) {
    case 'post':
      return <>{postFormComponent}</>;
    case 'report':
      return <>{reportFormComponent}</>;
    case 'list':
      return <>{postListComponent}</>;
    case 'my-page':
      return <>{myPageComponent}</>;
    default:
      return <>{postListComponent}</>; // Default to the list view
  }
};

export default FormSwapper;
