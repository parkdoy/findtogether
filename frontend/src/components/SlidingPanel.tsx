import React from 'react';
import './SlidingPanel.css';
import useWindowSize from '../utils/useWindowSize'; // Import the hook
import logoImg from '/handstogether.svg';
import FormSwapper from './FormSwapper'; // Import the new component

export type PanelType = 'post' | 'report' | 'list';

interface SlidingPanelProps {
  postFormComponent: React.ReactNode;
  reportFormComponent: React.ReactNode;
  postListComponent: React.ReactNode;
  activePanel: PanelType | null;
  setActivePanel: (panel: PanelType | null) => void;
}

const SlidingPanel: React.FC<SlidingPanelProps> = ({
  postFormComponent,
  reportFormComponent,
  postListComponent,
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
          <b><img src={logoImg} alt="logo"/> 함께찾기</b>
          {tabButtons}
        </div>
      )}

      <div className={`expanding-panel ${activePanel ? 'open' : ''}`}>
        <div className="panel-header">
          {isMobile && <div className="mobile-tabs">{tabButtons}</div>}
          <b><img src={logoImg} alt="logo" className='panel-logo'/>함께찾기</b>
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
          />
        </div>
      </div>
    </div>
  );
};

export default SlidingPanel;