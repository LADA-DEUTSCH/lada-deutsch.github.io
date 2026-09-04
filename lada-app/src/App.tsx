import { useState } from 'react';
import { PinGate } from './components/PinGate';
import { DeutschBeatApp } from './components/DeutschBeatApp';

export default function App() {
  const [keys, setKeys] = useState<string[] | null>(null);

  const handleLockVault = () => {
    setKeys(null);
  };

  if (!keys) {
    return <PinGate onAuthenticated={(unlockedKeys) => setKeys(unlockedKeys)} />;
  }

  return <DeutschBeatApp onLockVault={handleLockVault} />;
}
