import { useEffect } from 'react';
import { DeutschBeatApp } from './components/DeutschBeatApp';
import { getOrUnlockGeminiKey } from './services/aiProfessorService';

export default function App() {
  useEffect(() => {
    // Silently unlock API keys in the background
    getOrUnlockGeminiKey().catch(() => {});
  }, []);

  return <DeutschBeatApp />;
}
