import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../app/global.css';
import './diagnostics.css';
import { DiagnosticsApp } from './DiagnosticsApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DiagnosticsApp />
  </StrictMode>,
);
