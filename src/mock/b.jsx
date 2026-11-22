import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Mock from './Mock.jsx';
import(/* @vite-ignore */ '/os/shell/ask-pill.js').then((m) => m.mountAskPill()).catch(() => {});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Mock variant="b" />
  </StrictMode>,
);
