// Static entry for /work/. No router and no three.js: this page is what a
// recruiter's shared link, a no-WebGL device, or a slow connection lands on.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Work from './Work.jsx';
import { prefetchRoom } from './prefetchRoom.js';
import { initAnalytics } from '../lib/analytics.js';

prefetchRoom();
initAnalytics();
import(/* @vite-ignore */ '/os/shell/ask-pill.js').then((m) => m.mountAskPill()).catch(() => {});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Work />
  </StrictMode>,
);
