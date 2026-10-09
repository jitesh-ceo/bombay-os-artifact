import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/orbitron/500.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/rajdhani/500.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/stage.css';
import './styles/overlays.css';
import './styles/map.css';
import './styles/extras.css';
import './styles/room.css';
import './styles/hud.css';
import './jarvis/ui/jarvis.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
