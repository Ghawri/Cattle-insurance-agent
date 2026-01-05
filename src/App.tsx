import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { NewPolicyScreen } from './components/NewPolicyScreen';
import { ClaimsScreen } from './components/ClaimsScreen';
import { RenewalsScreen } from './components/RenewalsScreen';
import { FarmerUploadPortal } from './components/FarmerUploadPortal';
import { Toaster } from './components/ui/sonner';
import { Language } from './utils/translations';
import { projectId, publicAnonKey } from './utils/supabase/info';

type Screen = 'login' | 'dashboard' | 'new-policy' | 'claims' | 'renewals' | 'farmer-upload';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [language, setLanguage] = useState<Language>('en');
  const [accessToken, setAccessToken] = useState<string>('');
  const [agent, setAgent] = useState<any>(null);
  const [stats, setStats] = useState({ totalFarmers: 0, totalPolicies: 0, activePolicies: 0 });
  const [renewals, setRenewals] = useState<any[]>([]);

  // Check for farmer upload token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setScreen('farmer-upload');
    }
  }, []);

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken || publicAnonKey}`,
      ...options.headers,
    };

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-907e83b0${endpoint}`,
      { ...options, headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API call failed');
    }

    return response.json();
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      const result = await apiCall('/agent/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      setAccessToken(result.accessToken);
      setAgent(result.agent);
      setScreen('dashboard');
      await loadDashboardData(result.accessToken);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loadDashboardData = async (token: string) => {
    try {
      const statsResult = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-907e83b0/agent/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const statsData = await statsResult.json();
      setStats(statsData);

      const renewalsResult = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-907e83b0/agent/renewals`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const renewalsData = await renewalsResult.json();
      setRenewals(renewalsData.renewals || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleLogout = () => {
    setAccessToken('');
    setAgent(null);
    setScreen('login');
  };

  const handleCreatePolicy = async (policyData: any) => {
    try {
      // Create farmer first
      const farmerResult = await apiCall('/farmer/create', {
        method: 'POST',
        body: JSON.stringify({
          farmerName: policyData.farmerName,
          farmerPhone: policyData.farmerPhone,
          village: policyData.village,
          district: policyData.district,
          state: policyData.state,
        }),
      });

      // Create policy
      const policyResult = await apiCall('/policy/create', {
        method: 'POST',
        body: JSON.stringify({
          farmerId: farmerResult.farmerId,
          cattleType: policyData.cattleType,
          breed: policyData.breed,
          age: policyData.age,
          uhfTag: policyData.uhfTag,
          cattleValue: policyData.cattleValue,
          premiumAmount: policyData.premiumAmount,
          coverageAmount: policyData.coverageAmount,
          paymentMethod: policyData.paymentMethod,
        }),
      });

      await loadDashboardData(accessToken);
      return policyResult;
    } catch (error) {
      console.error('Error creating policy:', error);
      throw error;
    }
  };

  const handleCreateClaim = async (claimData: any) => {
    try {
      const result = await apiCall('/claim/create', {
        method: 'POST',
        body: JSON.stringify(claimData),
      });
      return result;
    } catch (error) {
      console.error('Error creating claim:', error);
      throw error;
    }
  };

  const handleGenerateUploadLink = async (claimId: string, farmerId: string) => {
    try {
      const result = await apiCall('/claim/generate-link', {
        method: 'POST',
        body: JSON.stringify({ claimId, farmerId }),
      });
      return result.uploadUrl;
    } catch (error) {
      console.error('Error generating upload link:', error);
      throw error;
    }
  };

  const handleVerifyClaim = async (claimId: string) => {
    try {
      const result = await apiCall('/claim/verify', {
        method: 'POST',
        body: JSON.stringify({ claimId }),
      });
      return result;
    } catch (error) {
      console.error('Error verifying claim:', error);
      throw error;
    }
  };

  // Render farmer upload portal
  if (screen === 'farmer-upload') {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    return (
      <>
        <FarmerUploadPortal 
          token={token || ''} 
          onComplete={() => {}}
        />
        <Toaster />
      </>
    );
  }

  return (
    <>
      {screen === 'login' && (
        <LoginScreen 
          onLogin={handleLogin}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}

      {screen === 'dashboard' && (
        <Dashboard
          agent={agent}
          stats={stats}
          onNavigate={setScreen}
          onLogout={handleLogout}
          language={language}
        />
      )}

      {screen === 'new-policy' && (
        <NewPolicyScreen
          onBack={() => setScreen('dashboard')}
          onSubmit={handleCreatePolicy}
          language={language}
        />
      )}

      {screen === 'claims' && (
        <ClaimsScreen
          onBack={() => setScreen('dashboard')}
          onSubmit={handleCreateClaim}
          onGenerateLink={handleGenerateUploadLink}
          onVerifyClaim={handleVerifyClaim}
          language={language}
        />
      )}

      {screen === 'renewals' && (
        <RenewalsScreen
          onBack={() => setScreen('dashboard')}
          renewals={renewals}
          language={language}
        />
      )}

      <Toaster />
    </>
  );
}
