// FocusLock: the original Electron renderer hosted in a same-origin iframe.
import { iframeApp } from '../shell/iframeApp.js';

export default iframeApp({
  id: 'focuslock',
  title: 'FocusLock Desktop Dashboard · demo data',
  icon: '🛡️',
  src: '/apps/focuslock/',
});
