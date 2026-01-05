import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Bell, Send, Phone } from 'lucide-react';
import { Language, getTranslation } from '../utils/translations';

interface RenewalsScreenProps {
  onBack: () => void;
  renewals: any[];
  language: Language;
}

export function RenewalsScreen({ onBack, renewals, language }: RenewalsScreenProps) {
  const t = (key: string) => getTranslation(language, key);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getDaysUntilRenewal = (dateString: string) => {
    const days = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
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
          <h1 className="text-xl">{t('upcomingRenewals')}</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {renewals.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No upcoming renewals</p>
          </Card>
        ) : (
          renewals.map((renewal: any) => {
            const daysLeft = getDaysUntilRenewal(renewal.nextRenewalDate);
            return (
              <Card key={renewal.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3>{renewal.farmer?.farmerName || 'Unknown Farmer'}</h3>
                    <p className="text-sm text-gray-600">
                      {renewal.farmer?.village}, {renewal.farmer?.district}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    daysLeft <= 7 ? 'bg-red-100 text-red-800' :
                    daysLeft <= 15 ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {daysLeft} days left
                  </div>
                </div>

                <div className="space-y-1 text-sm mb-4">
                  <p>
                    <strong>{t('policyNumber')}:</strong> {renewal.id.substring(0, 8)}
                  </p>
                  <p>
                    <strong>{t('cattleType')}:</strong> {renewal.cattleType}
                  </p>
                  <p>
                    <strong>{t('dueDate')}:</strong> {formatDate(renewal.nextRenewalDate)}
                  </p>
                  <p>
                    <strong>{t('premiumAmount')}:</strong> ₹{renewal.premiumAmount}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {t('collectPremium')}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
