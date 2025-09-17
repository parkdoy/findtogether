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

  return (
    <div className={`sliding-panel-container ${activePanel ? 'panel-open' : ''}`}>
      <div className="main-sidebar">
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
        <div className="panel-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SlidingPanel;
