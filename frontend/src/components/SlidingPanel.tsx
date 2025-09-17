import React from 'react';
import './SlidingPanel.css';

export type PanelType = 'post' | 'report' | 'list';

interface SlidingPanelProps {
  children: React.ReactNode;
  activePanel: PanelType | null;
  setActivePanel: (panel: PanelType | null) => void;
}

const SlidingPanel: React.FC<SlidingPanelProps> = ({ children, activePanel, setActivePanel }) => {

  const handleTabClick = (panel: PanelType) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const closePanel = () => {
    setActivePanel(null);
  }

  return (
    <div className="sliding-panel-container">
      <div className="main-sidebar">
        <b>함께찾기</b>
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
      </div>
      <div className={`expanding-panel ${activePanel ? 'open' : ''}`}>
        <div className="panel-header">
          <b>함께찾기</b>
          <button onClick={closePanel} className="close-panel-button" aria-label="Close panel">
            &times;
          </button>
        </div>
        <div className="panel-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SlidingPanel;
