import React, { useState } from 'react';
import type { Location } from '../types';

interface PostFormProps {
  onSubmit: (formData: FormData) => void;
  handleAddressSearch: (addressString: string, locationSetter: (location: Location) => void) => void;
  postLocation: Location | null;
  setPostLocation: (location: Location | null) => void;
}

const PostForm: React.FC<PostFormProps> = ({ onSubmit, handleAddressSearch, postLocation, setPostLocation }) => {
  const [name, setName] = useState('');
  const [features, setFeatures] = useState('');
  const [lastSeenTime, setLastSeenTime] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [address, setAddress] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !lastSeenTime || !postLocation || !file) {
      alert('이미지, 이름, 장소, 시간을 모두 입력해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('features', features);
    formData.append('lastSeenTime', lastSeenTime);
    formData.append('lastSeenLocation', JSON.stringify(postLocation));
    formData.append('image', file);

    onSubmit(formData);

    // Clear form
    setName('');
    setFeatures('');
    setLastSeenTime('');
    setFile(null);
    setPostLocation(null);
    setAddress('');
    (event.target as HTMLFormElement).reset();
  };

  return (
    <form id="post-form" onSubmit={handleSubmit} className="form-container">
      <label htmlFor="image">이미지</label>
      <input type="file" id="image" name="image" accept="image/*" onChange={handleFileChange} required />

      <label htmlFor="name">이름</label>
      <input type="text" id="name" name="name" placeholder="이름" value={name} onChange={e => setName(e.target.value)} required />

      <label>장소</label>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="주소로 검색" style={{ flex: 1 }} />
        <button type="button" onClick={() => handleAddressSearch(address, setPostLocation as (location: Location) => void)}>검색</button>
      </div>
      <p style={{ margin: 0, fontSize: '0.9em', color: '#555' }}>또는 지도에서 마지막 목격 장소를 클릭하세요.</p>
      {postLocation && <p style={{ margin: 0 }}>선택된 위치: {postLocation.lat.toFixed(4)}, {postLocation.lng.toFixed(4)}</p>}

      <label htmlFor="lastSeenTime">시간</label>
      <input type="datetime-local" id="lastSeenTime" name="lastSeenTime" value={lastSeenTime} onChange={e => setLastSeenTime(e.target.value)} required />

      <label htmlFor="features">상황설명</label>
      <textarea id="features" name="features" placeholder="특징" value={features} onChange={e => setFeatures(e.target.value)} />

      <button type="submit" style={{ marginTop: '10px' }}>등록</button>
    </form>
  );
}

export default PostForm;