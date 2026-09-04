import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw } from 'lucide-react';

interface OrientationGuardProps {
  children: React.ReactNode;
}

export const OrientationGuard: React.FC<OrientationGuardProps> = ({ children }) => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if width is less than height and screen is mobile/tablet size
      const isMobileSize = window.innerWidth <= 1024;
      const isHeightGreater = window.innerHeight > window.innerWidth;
      setIsPortrait(isMobileSize && isHeightGreater);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (isPortrait) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#040711',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          color: '#ffffff',
          userSelect: 'none'
        }}
      >
        {/* Animated Rotating Phone Graphic */}
        <div
          style={{
            position: 'relative',
            width: '100px',
            height: '100px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(56, 189, 248, 0) 70%)',
              animation: 'pulse 2s infinite ease-in-out'
            }}
          />
          <div
            style={{
              transform: 'rotate(-90deg)',
              animation: 'spinPhone 2.5s infinite ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Smartphone size={64} color="#38bdf8" />
          </div>
          <RotateCw
            size={24}
            color="#facc15"
            style={{
              position: 'absolute',
              bottom: '-8px',
              right: '-8px',
              animation: 'spin 3s linear infinite'
            }}
          />
        </div>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 900,
            color: '#ffffff',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}
        >
          DOWWER T-TILIFOUN B L-3ERD
        </h1>

        <p
          style={{
            fontSize: '15px',
            color: '#38bdf8',
            fontWeight: 700,
            marginBottom: '16px'
          }}
        >
          🔄 Rotate to Landscape Mode
        </p>

        <p
          style={{
            fontSize: '13px',
            color: '#94a3b8',
            maxWidth: '320px',
            lineHeight: '1.5',
            margin: 0
          }}
        >
          Had l-game masnou3a bash t-tl3eb <strong>Horizontal</strong> b widescreen w b jouj iddin (two-thumb controls)!
        </p>

        <style>{`
          @keyframes spinPhone {
            0% { transform: rotate(0deg); }
            40% { transform: rotate(90deg); }
            60% { transform: rotate(90deg); }
            100% { transform: rotate(0deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};
