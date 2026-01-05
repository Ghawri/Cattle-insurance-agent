import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import { Language, getTranslation } from '../utils/translations';
import { toast } from 'sonner@2.0.3';

interface ClaimsScreenProps {
  onBack: () => void;
  onSubmit: (claimData: any) => Promise<any>;
  onGenerateLink: (claimId: string, farmerId: string) => Promise<string>;
  onVerifyClaim: (claimId: string) => Promise<any>;
  language: Language;
}

export function ClaimsScreen({ onBack, onSubmit, onGenerateLink, onVerifyClaim, language }: ClaimsScreenProps) {
  const [step, setStep] = useState(1);
  const [claimId, setClaimId] = useState('');
  const [formData, setFormData] = useState({
    policyId: '',
    farmerId: '',
    farmerName: '',
    dateOfDeath: '',
    causeOfDeath: 'natural',
    description: '',
  });

  const [images, setImages] = useState<{
    front?: File;
    back?: File;
    side?: File;
    breathing?: File;
    video?: File;
  }>({});

  const [uploadLink, setUploadLink] = useState('');
  const [mlResult, setMlResult] = useState<any>(null);

  const t = (key: string) => getTranslation(language, key);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageCapture = (type: string, file: File) => {
    setImages(prev => ({ ...prev, [type]: file }));
  };

  const handleCreateClaim = async () => {
    try {
      const result = await onSubmit(formData);
      setClaimId(result.claimId);
      setStep(2);
      toast.success(t('claimSubmitted'));
    } catch (error) {
      toast.error('Error creating claim');
    }
  };

  const handleGenerateLink = async () => {
    try {
      const link = await onGenerateLink(claimId, formData.farmerId);
      setUploadLink(link);
      toast.success(t('linkSent'));
    } catch (error) {
      toast.error('Error generating link');
    }
  };

  const handleVerify = async () => {
    try {
      const result = await onVerifyClaim(claimId);
      setMlResult(result.verification);
      setStep(3);
    } catch (error) {
      toast.error('Error verifying claim');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-green-700 mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl">{t('newClaim')}</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Step 1: Claim Details */}
        {step === 1 && (
          <div className="space-y-4">
            <Card className="p-4 space-y-4">
              <h2>{t('claimDetails')}</h2>

              <div className="space-y-2">
                <Label>{t('policyNumber')}</Label>
                <Input
                  value={formData.policyId}
                  onChange={(e) => handleChange('policyId', e.target.value)}
                  placeholder="Policy ID"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('farmerName')}</Label>
                <Input
                  value={formData.farmerName}
                  onChange={(e) => handleChange('farmerName', e.target.value)}
                  placeholder={t('farmerName')}
                />
              </div>

              <div className="space-y-2">
                <Label>Farmer ID</Label>
                <Input
                  value={formData.farmerId}
                  onChange={(e) => handleChange('farmerId', e.target.value)}
                  placeholder="Farmer ID"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('dateOfDeath')}</Label>
                <Input
                  type="date"
                  value={formData.dateOfDeath}
                  onChange={(e) => handleChange('dateOfDeath', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('causeOfDeath')}</Label>
                <Select value={formData.causeOfDeath} onValueChange={(val) => handleChange('causeOfDeath', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">{t('natural')}</SelectItem>
                    <SelectItem value="accident">{t('accident')}</SelectItem>
                    <SelectItem value="disease">{t('disease')}</SelectItem>
                    <SelectItem value="unknown">{t('unknown')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Additional details"
                />
              </div>

              <Button onClick={handleCreateClaim} className="w-full">
                {t('submit')}
              </Button>
            </Card>
          </div>
        )}

        {/* Step 2: Image Capture or Send Link */}
        {step === 2 && (
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="mb-4">{t('uploadDeadCattleImages')}</h2>
              <p className="text-sm text-gray-600 mb-4">
                Choose to capture images yourself or send a link to the farmer
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button 
                  variant="outline" 
                  onClick={handleGenerateLink}
                  className="h-auto py-4 flex-col"
                >
                  <Send className="w-6 h-6 mb-2" />
                  <span className="text-xs">{t('sendFarmerLink')}</span>
                </Button>

                <Button 
                  variant="outline"
                  onClick={() => setStep(2.5)}
                  className="h-auto py-4 flex-col"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs">Capture Now</span>
                </Button>
              </div>

              {uploadLink && (
                <div className="bg-green-50 p-4 rounded space-y-2">
                  <p className="text-sm">Link generated successfully!</p>
                  <div className="bg-white p-3 rounded text-xs break-all border">
                    {window.location.origin}{uploadLink}
                  </div>
                  <p className="text-xs text-gray-600">
                    Share this link via SMS or WhatsApp to the farmer
                  </p>
                </div>
              )}

              {(uploadLink || Object.keys(images).length > 0) && (
                <Button onClick={handleVerify} className="w-full mt-4">
                  {t('verifyWithML')}
                </Button>
              )}
            </Card>
          </div>
        )}

        {/* Step 2.5: Capture Images by Agent */}
        {step === 2.5 && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2>{t('captureImages')}</h2>
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  {t('back')}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Follow the guidance to capture clear images and video of the deceased cattle
              </p>
            </Card>

            <CameraCapture
              label={`${t('frontView')} (Dead Cattle)`}
              type="photo"
              onCapture={(file) => handleImageCapture('front', file)}
              capturedFile={images.front}
            />

            <CameraCapture
              label={`${t('backView')} (Dead Cattle)`}
              type="photo"
              onCapture={(file) => handleImageCapture('back', file)}
              capturedFile={images.back}
            />

            <CameraCapture
              label={`${t('leftView')} (Dead Cattle)`}
              type="photo"
              onCapture={(file) => handleImageCapture('side', file)}
              capturedFile={images.side}
            />

            <Card className="p-4 bg-yellow-50">
              <p className="text-sm mb-3">
                <strong>Breathing Test:</strong> Place your phone camera sideways on the cattle's body for 10 seconds to check for movement
              </p>
            </Card>

            <CameraCapture
              label="Breathing Check Video"
              type="video"
              onCapture={(file) => handleImageCapture('breathing', file)}
              capturedFile={images.breathing}
            />

            <CameraCapture
              label={t('recordVideo')}
              type="video"
              onCapture={(file) => handleImageCapture('video', file)}
              capturedFile={images.video}
            />

            {Object.keys(images).length >= 4 && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  {t('back')}
                </Button>
                <Button onClick={handleVerify} className="flex-1">
                  {t('verifyWithML')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: ML Verification Results */}
        {step === 3 && mlResult && (
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="mb-4">{t('mlVerification')}</h2>

              {/* Deceased Status */}
              <div className={`p-4 rounded mb-4 ${
                mlResult.isDeceased ? 'bg-red-50' : 'bg-yellow-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {mlResult.isDeceased ? (
                    <CheckCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className="font-medium">
                    {mlResult.isDeceased ? t('cattleDeceased') : t('cattleAlive')}
                  </span>
                </div>
                <p className="text-sm">
                  {t('confidence')}: {(mlResult.confidence * 100).toFixed(0)}%
                </p>
              </div>

              {/* Cattle Match */}
              <div className="p-4 bg-blue-50 rounded mb-4">
                <p className="text-sm mb-1">
                  <strong>{t('cattleMatch')}:</strong> {mlResult.cattleMatch ? 'Yes' : 'No'}
                </p>
                <p className="text-sm">
                  {t('causeOfDeath')}: {mlResult.causeOfDeath}
                </p>
              </div>

              {/* Suspicious Indicators */}
              {mlResult.suspiciousIndicators && mlResult.suspiciousIndicators.length > 0 && (
                <Card className="p-4 bg-orange-50 border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">{t('suspiciousActivity')}</span>
                  </div>
                  <ul className="text-sm space-y-1 ml-7">
                    {mlResult.suspiciousIndicators.map((indicator: string, idx: number) => (
                      <li key={idx}>• {indicator}</li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Suggested Action */}
              <div className="mt-6 p-4 bg-gray-50 rounded">
                <p className="text-sm mb-2">
                  <strong>Suggested Action:</strong>
                </p>
                <div className={`inline-block px-3 py-1 rounded text-sm ${
                  mlResult.suggestedAction === 'approve' ? 'bg-green-100 text-green-800' :
                  mlResult.suggestedAction === 'manual_review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {mlResult.suggestedAction === 'approve' ? t('approved') :
                   mlResult.suggestedAction === 'manual_review' ? t('underReview') :
                   t('investigationRequired')}
                </div>
              </div>

              {mlResult.suggestedAction === 'investigation_required' && (
                <div className="mt-4 p-4 bg-red-50 rounded border border-red-200">
                  <p className="text-sm">
                    <strong>{t('investigationRequired')}</strong>
                  </p>
                  <p className="text-sm mt-2">
                    Please obtain an investigative certificate for the cause of death before processing this claim.
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={onBack} className="flex-1">
                  Done
                </Button>
                {mlResult.suggestedAction === 'approve' && (
                  <Button className="flex-1">
                    Approve Claim
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
