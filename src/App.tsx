import React from 'react';
import { PlayerProvider } from './context/PlayerContext';
import { AppShell } from './components/AppShell';

export const App: React.FC = () => {
  return (
    <PlayerProvider>
      <AppShell />
    </PlayerProvider>
  );
};

export default App;
