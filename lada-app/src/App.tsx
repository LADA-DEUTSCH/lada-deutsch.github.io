import { useState } from 'react';
import { PinGate } from './components/PinGate';
import { LiveCompanion } from './components/LiveCompanion';
import { loadProfile, saveProfile } from './services/srsEngine';
import type { LearnerProfile } from './types';

export default function App() {
  const [keys, setKeys] = useState<string[] | null>(null);
  const [profile, setProfile] = useState<LearnerProfile>(loadProfile());

  const handleProfileUpdate = (updated: LearnerProfile) => {
    setProfile(updated);
    saveProfile(updated);
  };

  const handleLockVault = () => {
    setKeys(null);
  };

  if (!keys) {
    return <PinGate onAuthenticated={(unlockedKeys) => setKeys(unlockedKeys)} />;
  }

  return (
    <LiveCompanion
      apiKeys={keys}
      profile={profile}
      onProfileUpdate={handleProfileUpdate}
      onLockVault={handleLockVault}
    />
  );
}
