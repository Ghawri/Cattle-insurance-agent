import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Users, FileText, Bell, Plus, LogOut } from 'lucide-react';
import { Language, getTranslation } from '../utils/translations';

interface DashboardProps {
  agent: any;
  stats: { totalFarmers: number; totalPolicies: number; activePolicies: number };
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  language: Language;
}

export function Dashboard({ agent, stats, onNavigate, onLogout, language }: DashboardProps) {
  const t = (key: string) => getTranslation(language, key);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <h1 className="text-xl">{t('welcome')}</h1>
            <p className="text-sm opacity-90">{agent.name}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onLogout}
            className="text-white hover:bg-green-700"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl">{stats.totalFarmers}</p>
            <p className="text-xs text-gray-600">{t('totalFarmers')}</p>
          </Card>
          
          <Card className="p-4 text-center">
            <FileText className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl">{stats.activePolicies}</p>
            <p className="text-xs text-gray-600">{t('activePolicies')}</p>
          </Card>
          
          <Card className="p-4 text-center">
            <Bell className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl">0</p>
            <p className="text-xs text-gray-600">{t('upcomingRenewals')}</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-4">
          <h2 className="mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button 
              onClick={() => onNavigate('new-policy')} 
              className="w-full justify-start"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-3" />
              {t('newPolicy')}
            </Button>
            
            <Button 
              onClick={() => onNavigate('renewals')} 
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <Bell className="w-5 h-5 mr-3" />
              {t('renewals')}
            </Button>
            
            <Button 
              onClick={() => onNavigate('claims')} 
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <FileText className="w-5 h-5 mr-3" />
              {t('claims')}
            </Button>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4">
          <h2 className="mb-3">Recent Activity</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>No recent activity</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
