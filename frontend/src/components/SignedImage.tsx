import React, { useState, useEffect } from 'react';

interface SignedImageProps {
  gcsObjectName: string;
  alt: string;
  apiUrl: string; // API_URL passed from App.tsx
  className?: string;
}

const SignedImage: React.FC<SignedImageProps> = ({ gcsObjectName, alt, apiUrl, className }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gcsObjectName) {
      setSignedUrl(null);
      return;
    }

    const fetchSignedUrl = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/signed-url?filename=${encodeURIComponent(gcsObjectName)}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch signed URL: ${response.statusText}`);
        }
        const data = await response.json();
        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error('Error fetching signed URL:', err);
        setError('Failed to load image');
      }
    };

    fetchSignedUrl();
  }, [gcsObjectName, apiUrl]);

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!signedUrl) {
    return <div>Loading image...</div>; // Or a placeholder
  }

  return <img src={signedUrl} alt={alt} className={className} />;
};

export default SignedImage;
