import React, { useState } from 'react';
import type { Location } from '../types';
import './ReportForm.css';

interface ReportFormProps {
  selectedPostName: string;
  onSubmit: (formData: FormData) => void;
  handleAddressSearch: (addressString: string, locationSetter: (location: Location) => void) => void;
  onCancel: () => void;
  reportLocation: Location | null;
  setReportLocation: (location: Location | null) => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ selectedPostName, onSubmit, handleAddressSearch, onCancel, reportLocation, setReportLocation }) => {
  const [reportDescription, setReportDescription] = useState('');
  const [reportTime, setReportTime] = useState('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportAddress, setReportAddress] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setReportFile(event.target.files[0]);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reportTime || !reportLocation) {
      alert('시간과 장소를 모두 입력해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('time', reportTime);
    formData.append('description', reportDescription);
    formData.append('location', JSON.stringify(reportLocation));
    if (reportFile) {
      formData.append('image', reportFile);
    }

    onSubmit(formData);
  };

  return (
    <form id="report-form" onSubmit={handleSubmit} className="report-form">
      <h2>'{selectedPostName}' 제보 등록</h2>
      <label htmlFor="report-image">이미지 (선택)</label>
      <input id="report-image" type="file" accept="image/*" onChange={handleFileChange} />

      <label>장소</label>
      <div className="address-search-container">
        <input type="text" value={reportAddress} onChange={e => setReportAddress(e.target.value)} placeholder="주소로 검색" />
        <button type="button" onClick={() => handleAddressSearch(reportAddress, setReportLocation as (location: Location) => void)}>검색</button>
      </div>
      <p className="map-guidance">또는 지도에서 제보 장소를 클릭하세요.</p>
      {reportLocation && <p className="location-info">선택된 위치: {reportLocation.lat.toFixed(4)}, {reportLocation.lng.toFixed(4)}</p>}

      <label htmlFor="report-time">시간</label>
      <input id="report-time" type="datetime-local" value={reportTime} onChange={e => setReportTime(e.target.value)} required />

      <label htmlFor="report-description">상황설명</label>
      <textarea id="report-description" value={reportDescription} onChange={e => setReportDescription(e.target.value)} />

      <div className="form-buttons">
        <button type="submit">제출</button>
        <button type="button" onClick={onCancel}>취소</button>
      </div>
    </form>
  );
}

export default ReportForm;