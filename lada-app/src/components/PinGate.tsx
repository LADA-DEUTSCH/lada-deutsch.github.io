import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, ArrowRight } from 'lucide-react';
import { unlockVault, isVaultInitialized, setupInitialVault } from '../services/cryptoVault';

interface PinGateProps {
  onAuthenticated: (keys: string[]) => void;
}

export const PinGate: React.FC<PinGateProps> = ({ onAuthenticated }) => {
  const [pin, setPin] = useState('');
  const [isFirstTime] = useState(!isVaultInitialized());
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin || pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isFirstTime) {
        if (pin !== confirmPin) {
          setError('PINs do not match');
          setLoading(false);
          return;
        }
        await setupInitialVault(pin);
        const keys = await unlockVault(pin);
        if (keys) {
          onAuthenticated(keys);
        } else {
          setError('Vault initialization failed');
        }
      } else {
        const keys = await unlockVault(pin);
        if (keys) {
          onAuthenticated(keys);
        } else {
          setError('Incorrect PIN. Access Denied.');
        }
      }
    } catch {
      setError('Decryption failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #0e1626 0%, #060911 100%)',
      padding: '20px',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '380px',
        width: '100%',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '32px 24px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(56, 189, 248, 0.1)',
        textAlign: 'center'
      }}>
        {/* Header Badge */}
        <div style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 16px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(14, 165, 233, 0.4)'
        }}>
          {isFirstTime ? <Key size={28} color="#fff" /> : <Lock size={28} color="#fff" />}
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '6px' }}>
          {isFirstTime ? 'Secure Your LADA Vault' : 'LADA Gatekeeper'}
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px', lineHeight: '1.4' }}>
          {isFirstTime
            ? 'Set your private Master PIN to lock your companion and encrypt your 6 API keys locally.'
            : 'Enter your Master PIN to unlock your encrypted German acquisition chamber.'}
        </p>

        {/* PIN Indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: pin.length > idx ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)',
                boxShadow: pin.length > idx ? '0 0 12px #38bdf8' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '13px',
            padding: '8px 12px',
            borderRadius: '10px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {isFirstTime && (
          <input
            type="password"
            placeholder="Confirm Master PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontSize: '15px',
              marginBottom: '16px',
              textAlign: 'center'
            }}
          />
        )}

        {/* Keypad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeypadPress(num)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '20px',
                fontWeight: 600,
                padding: '16px 0',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: 'none',
              color: '#94a3b8',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '16px',
              cursor: 'pointer'
            }}
          >
            Del
          </button>
          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#fff',
              fontSize: '20px',
              fontWeight: 600,
              padding: '16px 0',
              borderRadius: '16px',
              cursor: 'pointer'
            }}
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading || pin.length < 4}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
              cursor: pin.length >= 4 ? 'pointer' : 'not-allowed',
              opacity: pin.length >= 4 ? 1 : 0.4
            }}
          >
            <ArrowRight size={22} />
          </button>
        </div>

        {/* Security badge note */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <ShieldCheck size={14} color="#38bdf8" />
          <span>AES-GCM 256-Bit Military Grade Local Vault</span>
        </div>
      </div>
    </div>
  );
};
