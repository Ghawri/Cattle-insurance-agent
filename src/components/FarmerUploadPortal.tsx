import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { CameraCapture } from './CameraCapture';

interface FarmerUploadPortalProps {
  token: string;
  onComplete: () => void;
}

export function FarmerUploadPortal({ token, onComplete }: FarmerUploadPortalProps) {
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<{
    front?: File;
    back?: File;
    side?: File;
    video?: File;
  }>({});
  const [uploadComplete, setUploadComplete] = useState(false);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(
        `https://gnhzkhlzmfwksfmykczk.supabase.co/functions/v1/make-server-907e83b0/upload/verify/${token}`,
        {
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaHpraGx6bWZ3a3NmbXlrY3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1ODE4NTksImV4cCI6MjA4MzE1Nzg1OX0.wHyYmfclrdR1hwRMA9AzVhL9vGtNEMulZ7z3rL1A9f0`,
          },
        }
      );

      if (response.ok) {
        setIsValidToken(true);
      } else {
        setError('Invalid or expired link');
      }
    } catch (err) {
      setError('Error verifying link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageCapture = (type: string, file: File) => {
    setImages(prev => ({ ...prev, [type]: file }));
  };

  const handleUpload = async () => {
    try {
      setIsLoading(true);

      // Upload all files
      for (const [type, file] of Object.entries(images)) {
        if (file) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('token', token);
          formData.append('fileType', type);

          await fetch(
            'https://gnhzkhlzmfwksfmykczk.supabase.co/functions/v1/make-server-907e83b0/upload/file',
            {
              method: 'POST',
              body: formData,
            }
          );
        }
      }

      setUploadComplete(true);
    } catch (err) {
      setError('Error uploading files');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !isValidToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <p>Verifying link...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (uploadComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <h1 className="text-2xl">Upload Complete!</h1>
          <p className="text-gray-600">
            Thank you for submitting the images and video. The insurance agent will review your claim.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            You can close this page now.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl">Cattle Insurance Claim</h1>
          <p className="text-sm opacity-90">Upload Images & Video</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {step === 0 && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="mb-4">Welcome</h2>
              <p className="text-sm text-gray-600 mb-4">
                Your insurance agent has requested you to upload images and a video of your cattle for claim processing.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Please follow the instructions carefully and capture clear photos from different angles.
              </p>
              <ul className="text-sm space-y-2 mb-6">
                <li>• Front view of the cattle</li>
                <li>• Back view of the cattle</li>
                <li>• Side view of the cattle</li>
                <li>• A video showing the cattle</li>
              </ul>
              <Button onClick={() => setStep(1)} className="w-full">
                Start Upload
              </Button>
            </Card>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="mb-4">Upload Images & Video</h2>
              <p className="text-sm text-gray-600 mb-4">
                Please capture clear images and a video as instructed
              </p>
            </Card>

            <CameraCapture
              label="Front View"
              type="photo"
              onCapture={(file) => handleImageCapture('front', file)}
              capturedFile={images.front}
            />

            <CameraCapture
              label="Back View"
              type="photo"
              onCapture={(file) => handleImageCapture('back', file)}
              capturedFile={images.back}
            />

            <CameraCapture
              label="Side View"
              type="photo"
              onCapture={(file) => handleImageCapture('side', file)}
              capturedFile={images.side}
            />

            <CameraCapture
              label="Video Recording"
              type="video"
              onCapture={(file) => handleImageCapture('video', file)}
              capturedFile={images.video}
            />

            {Object.keys(images).length >= 3 && (
              <div className="flex gap-3 pb-4">
                <Button 
                  onClick={handleUpload} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Uploading...' : 'Submit Upload'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
