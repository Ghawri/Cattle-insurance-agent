import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Camera } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import { Language, getTranslation } from '../utils/translations';
import { toast } from 'sonner@2.0.3';

interface NewPolicyScreenProps {
  onBack: () => void;
  onSubmit: (policyData: any) => Promise<void>;
  language: Language;
}

export function NewPolicyScreen({ onBack, onSubmit, language }: NewPolicyScreenProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Farmer details
    farmerName: '',
    farmerPhone: '',
    village: '',
    district: '',
    state: '',
    
    // Cattle details
    cattleType: 'cow',
    breed: '',
    age: '',
    uhfTag: '',
    cattleValue: '',
    
    // Policy details
    premiumAmount: '',
    coverageAmount: '',
    paymentMethod: 'cash',
  });

  const [images, setImages] = useState<{
    front?: File;
    back?: File;
    left?: File;
    right?: File;
    owner?: File;
    video?: File;
  }>({});

  const t = (key: string) => getTranslation(language, key);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageCapture = (type: string, file: File) => {
    setImages(prev => ({ ...prev, [type]: file }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleSubmit = async () => {
    try {
      const policyData = {
        ...formData,
        images: Object.keys(images).map(key => ({
          type: key,
          fileName: images[key as keyof typeof images]?.name,
        })),
      };
      
      await onSubmit(policyData);
      toast.success(t('policyCreated'));
      onBack();
    } catch (error) {
      toast.error('Error creating policy');
    }
  };

  const isStepValid = () => {
    if (step === 1) {
      return formData.farmerName && formData.farmerPhone && formData.village;
    }
    if (step === 2) {
      return formData.cattleType && formData.breed && formData.age && formData.uhfTag;
    }
    if (step === 3) {
      return images.front && images.back && images.left && images.right && images.owner && images.video;
    }
    if (step === 4) {
      return formData.premiumAmount && formData.coverageAmount;
    }
    return false;
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
          <h1 className="text-xl">{t('newPolicy')}</h1>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between text-xs">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  s === step ? 'bg-green-600 text-white' : 
                  s < step ? 'bg-green-200 text-green-800' : 'bg-gray-200'
                }`}>
                  {s}
                </div>
                {s < 4 && <div className={`w-12 h-1 ${s < step ? 'bg-green-200' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Farmer</span>
            <span>Cattle</span>
            <span>Photos</span>
            <span>Payment</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Step 1: Farmer Details */}
        {step === 1 && (
          <Card className="p-4 space-y-4">
            <h2>{t('farmerName')}</h2>
            
            <div className="space-y-2">
              <Label>{t('farmerName')}</Label>
              <Input
                value={formData.farmerName}
                onChange={(e) => handleChange('farmerName', e.target.value)}
                placeholder={t('farmerName')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('farmerPhone')}</Label>
              <Input
                type="tel"
                value={formData.farmerPhone}
                onChange={(e) => handleChange('farmerPhone', e.target.value)}
                placeholder={t('farmerPhone')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('village')}</Label>
              <Input
                value={formData.village}
                onChange={(e) => handleChange('village', e.target.value)}
                placeholder={t('village')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('district')}</Label>
                <Input
                  value={formData.district}
                  onChange={(e) => handleChange('district', e.target.value)}
                  placeholder={t('district')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('state')}</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder={t('state')}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Cattle Details */}
        {step === 2 && (
          <Card className="p-4 space-y-4">
            <h2>{t('cattleDetails')}</h2>

            <div className="space-y-2">
              <Label>{t('cattleType')}</Label>
              <Select value={formData.cattleType} onValueChange={(val) => handleChange('cattleType', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cow">Cow</SelectItem>
                  <SelectItem value="buffalo">Buffalo</SelectItem>
                  <SelectItem value="bull">Bull</SelectItem>
                  <SelectItem value="calf">Calf</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('breed')}</Label>
              <Input
                value={formData.breed}
                onChange={(e) => handleChange('breed', e.target.value)}
                placeholder={t('breed')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('age')}</Label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  placeholder="Age"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('cattleValue')}</Label>
                <Input
                  type="number"
                  value={formData.cattleValue}
                  onChange={(e) => handleChange('cattleValue', e.target.value)}
                  placeholder="Value"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('uhfTag')}</Label>
              <Input
                value={formData.uhfTag}
                onChange={(e) => handleChange('uhfTag', e.target.value)}
                placeholder={t('uhfTag')}
              />
            </div>
          </Card>
        )}

        {/* Step 3: Image Capture */}
        {step === 3 && (
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="mb-4">{t('captureImages')}</h2>
              <p className="text-sm text-gray-600 mb-4">
                Capture clear photos from all angles and a video of the cattle
              </p>
            </Card>

            <CameraCapture
              label={t('frontView')}
              type="photo"
              onCapture={(file) => handleImageCapture('front', file)}
              capturedFile={images.front}
            />

            <CameraCapture
              label={t('backView')}
              type="photo"
              onCapture={(file) => handleImageCapture('back', file)}
              capturedFile={images.back}
            />

            <CameraCapture
              label={t('leftView')}
              type="photo"
              onCapture={(file) => handleImageCapture('left', file)}
              capturedFile={images.left}
            />

            <CameraCapture
              label={t('rightView')}
              type="photo"
              onCapture={(file) => handleImageCapture('right', file)}
              capturedFile={images.right}
            />

            <CameraCapture
              label={t('ownerPhoto')}
              type="photo"
              onCapture={(file) => handleImageCapture('owner', file)}
              capturedFile={images.owner}
            />

            <CameraCapture
              label={t('recordVideo')}
              type="video"
              onCapture={(file) => handleImageCapture('video', file)}
              capturedFile={images.video}
            />
          </div>
        )}

        {/* Step 4: Payment & Policy Details */}
        {step === 4 && (
          <Card className="p-4 space-y-4">
            <h2>{t('policyDetails')}</h2>

            <div className="space-y-2">
              <Label>{t('premiumAmount')}</Label>
              <Input
                type="number"
                value={formData.premiumAmount}
                onChange={(e) => handleChange('premiumAmount', e.target.value)}
                placeholder="Premium Amount"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('coverageAmount')}</Label>
              <Input
                type="number"
                value={formData.coverageAmount}
                onChange={(e) => handleChange('coverageAmount', e.target.value)}
                placeholder="Coverage Amount"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('paymentMethod')}</Label>
              <Select value={formData.paymentMethod} onValueChange={(val) => handleChange('paymentMethod', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('cash')}</SelectItem>
                  <SelectItem value="qr">{t('qrCode')}</SelectItem>
                  <SelectItem value="netbanking">{t('netBanking')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.paymentMethod === 'qr' && (
              <div className="bg-gray-100 p-4 rounded text-center">
                <div className="w-48 h-48 bg-white mx-auto flex items-center justify-center border-2">
                  <p className="text-sm text-gray-500">QR Code Here</p>
                </div>
                <p className="text-xs mt-2">Scan to pay ₹{formData.premiumAmount}</p>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded">
              <h3 className="text-sm mb-2">Summary</h3>
              <div className="text-sm space-y-1">
                <p>Farmer: {formData.farmerName}</p>
                <p>Cattle: {formData.cattleType} - {formData.breed}</p>
                <p>Premium: ₹{formData.premiumAmount}</p>
                <p>Coverage: ₹{formData.coverageAmount}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6 pb-4">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              {t('back')}
            </Button>
          )}
          
          {step < 4 ? (
            <Button 
              onClick={handleNext} 
              disabled={!isStepValid()}
              className="flex-1"
            >
              {t('next')}
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={!isStepValid()}
              className="flex-1"
            >
              {t('submit')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
