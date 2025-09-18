import React, { useEffect, useRef } from 'react';
import './SlidingPanel.css';

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
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wrapperRef.current) {
      let scrollIndex = 0;
      if (activePanel === 'report') {
        scrollIndex = 1;
      } else if (activePanel === 'list') {
        scrollIndex = 2;
      }
      
      // translateX value is based on the index of the active panel.
      wrapperRef.current.style.transform = `translateX(-${scrollIndex * (100 / 3)}%)`;
    }
  }, [activePanel]);

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
        <div className="panel-content-wrapper" ref={wrapperRef}>
          <div className="panel-view" id="post-view">
            {postFormComponent}
          </div>
          <div className="panel-view" id="report-view">
            {reportFormComponent}
          </div>
          <div className="panel-view" id="list-view">
            {postListComponent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlidingPanel;