import React from 'react';
import './SlidingPanel.css';
import useWindowSize from '../utils/useWindowSize'; // Import the hook

import FormSwapper from './FormSwapper'; // Import the new component

export type PanelType = 'post' | 'report' | 'list' | 'my-page';

interface SlidingPanelProps {
  postFormComponent: React.ReactNode;
  reportFormComponent: React.ReactNode;
  postListComponent: React.ReactNode;
  myPageComponent: React.ReactNode; // Add prop for MyPageComponent
  activePanel: PanelType | null;
  setActivePanel: (panel: PanelType | null) => void;
}

const SlidingPanel: React.FC<SlidingPanelProps> = ({
  postFormComponent,
  reportFormComponent,
  postListComponent,
  myPageComponent, // Destructure new prop
  activePanel,
  setActivePanel
}) => {
  const { width } = useWindowSize();
  const isMobile = width <= 768;

  const handleTabClick = (panel: PanelType) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const closePanel = () => {
    setActivePanel(null);
  }

  const tabButtons = (
    <>
      <button 
        className={`tab-button ${activePanel === 'post' ? 'active' : ''}`}
        onClick={() => handleTabClick('post')}>
        등록
      </button>
      <button 
        className={`tab-button ${activePanel === 'report' ? 'active' : ''}`}
        onClick={() => handleTabClick('report')}>
        제보
      </button>
      <button 
        className={`tab-button ${activePanel === 'list' ? 'active' : ''}`}
        onClick={() => handleTabClick('list')}>
        목록
      </button>
    </>
  );

  return (
    <div className="sliding-panel-container">
      {!isMobile && (
        <div className="main-sidebar">
          
          {tabButtons}
        </div>
      )}

      <div className={`expanding-panel ${activePanel ? 'open' : ''}`}>
        <div className="panel-header">
          {isMobile && <div className="mobile-tabs">{tabButtons}</div>}
          
          <button onClick={closePanel} className="close-panel-button" aria-label="Close panel">
            &times;
          </button>
        </div>
        <div className="panel-view">
          <FormSwapper 
            activePanel={activePanel}
            postFormComponent={postFormComponent}
            reportFormComponent={reportFormComponent}
            postListComponent={postListComponent}
            myPageComponent={myPageComponent} // Pass down to FormSwapper
          />
        </div>
      </div>
    </div>
  );
};

export default SlidingPanel;