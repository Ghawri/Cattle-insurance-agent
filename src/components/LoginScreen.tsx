import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Lock, User } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { Language, getTranslation } from '../utils/translations';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function LoginScreen({ onLogin, language, onLanguageChange }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const t = (key: string) => getTranslation(language, key);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onLogin(username, password);
    } catch (err: any) {
      // Show more specific error message
      const errorMessage = err?.message || t('loginError');
      if (errorMessage.includes('Invalid login credentials')) {
        setError('Invalid username or password. Please check your credentials and try again.');
      } else {
        setError(errorMessage);
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector value={language} onChange={(val) => onLanguageChange(val as Language)} />
      </div>

      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-green-600 rounded-full mx-auto flex items-center justify-center">
            <span className="text-3xl">🐄</span>
          </div>
          <h1 className="text-2xl">Cattle Insurance</h1>
          <p className="text-sm text-gray-600">Agent Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t('username')}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('enterUsername')}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                className="pl-10"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Loading...' : t('login')}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-xs text-gray-500 text-center max-w-md">
        Demo credentials for testing: Username: agent1, Password: demo123
      </p>
    </div>
  );
}