import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { supabase } from '../lib/supabase';
import { checkEmail } from '../lib/api';
import { normalizeEmail, isGmailAddress, rememberRole } from '../lib/auth-utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'employee' | 'employer';
  mode: 'signup' | 'signin';
}

type AuthStep = 'initial' | 'email' | 'processing';

export function AuthModal({ isOpen, onClose, role, mode }: AuthModalProps) {
  const [step, setStep] = useState<AuthStep>('initial');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showManualGoogle, setShowManualGoogle] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);

  const startGoogleOAuth = async (fromEmailStep = false) => {
    try {
      setPopupBlocked(false);
      rememberRole(role);
      
      // Only set verified email if coming from email step
      if (fromEmailStep && email) {
        sessionStorage.setItem('verifiedEmail', normalizeEmail(email));
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/?role=${role}`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;

    } catch (error: any) {
      console.error('OAuth error:', error);
      if (error.message?.includes('popup') || error.message?.includes('blocked')) {
        setPopupBlocked(true);
      } else {
        setError('Authentication failed. Please try again.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !email.trim()) return;

    setLoading(true);
    setError('');
    
    const normalizedEmail = normalizeEmail(email);

    try {
      const response = await checkEmail(normalizedEmail, mode);

      if (!response.ok) {
        setError(response.message);
        setLoading(false);
        return;
      }

      // Auto-redirect for Gmail addresses
      if (isGmailAddress(normalizedEmail)) {
        await startGoogleOAuth(true);
        return;
      }

      // For non-Gmail addresses, show manual options
      setShowManualGoogle(true);

    } catch (error: any) {
      setError(error.message || 'Something went wrong. Please try again.');
      console.error('Email check failed:', error);
    }

    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  const resetModal = () => {
    setStep('initial');
    setEmail('');
    setError('');
    setShowManualGoogle(false);
    setPopupBlocked(false);
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const renderInitialOptions = () => (
    <div className="space-y-4">
      <p className="text-gray-600 text-center mb-6">
        You'll get smarter responses and can upload files, images, and more.
      </p>

      <Button
        onClick={() => setStep('email')}
        variant="outline"
        className="w-full"
        size="lg"
      >
        <span className="text-gray-900">Email address</span>
      </Button>

      <Button
        onClick={() => startGoogleOAuth()}
        className="w-full bg-black hover:bg-gray-800 text-white"
        size="lg"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </Button>
    </div>
  );

  const renderEmailForm = () => (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={() => setStep('initial')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Email Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          error={error}
          placeholder="Enter your email address"
        />

        <Button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Checking...
            </div>
          ) : (
            'Continue'
          )}
        </Button>
      </form>

      {/* Manual Google Option for Non-Gmail */}
      {showManualGoogle && !isGmailAddress(email) && (
        <div className="pt-4 border-t border-gray-200">
          <div className="text-center mb-4">
            <span className="text-sm text-gray-500">OR</span>
          </div>

          <Button
            onClick={() => startGoogleOAuth(true)}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          {/* Coming Soon Message for Non-Gmail */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600 text-center">
              <strong>Non-Gmail email sign-in coming soon!</strong><br/>
              For now, you can still use "Continue with Google" above.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title={step === 'initial' 
        ? (mode === 'signup' ? 'Log in or sign up' : 'Sign in')
        : `${mode === 'signup' ? 'Sign up' : 'Sign in'} ${role === 'employer' ? 'as Employer' : 'as Employee'}`
      }
    >
      <div className="space-y-4">
        {/* Popup Blocked Message */}
        {popupBlocked && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700">
              Your browser blocked the popup. Please{' '}
              <button
                onClick={() => startGoogleOAuth()}
                className="font-medium underline hover:no-underline"
              >
                click here to continue
              </button>
              .
            </p>
          </div>
        )}

        {step === 'initial' ? renderInitialOptions() : renderEmailForm()}
      </div>
    </Modal>
  );
}
