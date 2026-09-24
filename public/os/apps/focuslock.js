// FocusLock: the original Electron renderer hosted in a same-origin iframe.
import { iframeApp } from '../shell/iframeApp.js';

export default iframeApp({
  id: 'focuslock',
  title: 'FocusLock Desktop Dashboard · demo data',
  icon: '🛡️',
  src: '/apps/focuslock/',
  banner: {
    text: 'This is the Windows desktop app. Its Android half is the phone on the desk; both enforce one shared daily limit.',
    action: { label: 'Try the Android app ↗', available: (ctx) => !!ctx?.openPhone, run: (ctx) => ctx.openPhone('focuslock') },
  },
});
