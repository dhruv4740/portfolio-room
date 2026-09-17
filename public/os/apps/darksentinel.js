// DarkSentinel: the real Next.js UI (apps/darksentinel, built to
// public/apps/darksentinel/) in a window. Demo fixtures stand in for the backend.
import { iframeApp } from '../shell/iframeApp.js';

export default iframeApp({
  id: 'darksentinel',
  title: 'DarkSentinel · demo data',
  icon: '⚡',
  src: '/apps/darksentinel/',
});
