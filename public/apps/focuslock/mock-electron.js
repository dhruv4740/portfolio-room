// Portfolio seam for the Electron renderer. The original renderer keeps its
// UI and IPC method names; this in-browser bridge supplies deterministic demo
// state when the desktop agent is hosted in the portfolio iframe.
(() => {
  const today = new Date().toISOString();
  let policy = {
    targetDomains: ['youtube.com/shorts', 'instagram.com'],
    targetApps: ['Discord.exe'],
    dailyLimitMinutes: 60,
    extensionMinutes: 15,
    dailyExtensionLimit: 1,
    hardBlockAfterLimit: false,
    blockWindows: [],
  };
  let todos = [
    { id: 'demo-1', text: 'Review the FocusLock architecture', completed: true },
    { id: 'demo-2', text: 'Plan tomorrow\'s deep work block', completed: false },
  ];
  let session = { active: false };
  let syncId = 'demo-focuslock';

  const delay = (value, ms = 120) => new Promise(resolve => setTimeout(() => resolve(value), ms));
  const usageEvents = [
    { target: 'youtube.com/shorts', durationMinutes: 18, startedAt: today },
    { target: 'instagram.com', durationMinutes: 11, startedAt: today },
  ];

  window.electronAPI = {
    getSyncId: () => delay(syncId),
    setSyncId: (id) => delay(syncId = id),
    getPolicy: () => delay(structuredClone(policy)),
    updatePolicy: (next) => delay(policy = structuredClone(next)),
    getTodos: () => delay(structuredClone(todos)),
    addTodo: (text) => {
      todos = [...todos, { id: `demo-${Date.now()}`, text, completed: false }];
      return delay(true);
    },
    toggleTodo: (id, completed) => {
      todos = todos.map(todo => todo.id === id ? { ...todo, completed } : todo);
      return delay(true);
    },
    deleteTodo: (id) => {
      todos = todos.filter(todo => todo.id !== id);
      return delay(true);
    },
    startFocusSession: (minutes) => {
      session = { active: true, endsAt: new Date(Date.now() + minutes * 60_000).toISOString() };
      return delay({ ...session });
    },
    stopFocusSession: () => { session = { active: false }; return delay(true); },
    getFocusSession: () => delay({ ...session }),
    getEvents: () => delay(structuredClone(usageEvents)),
    getStreak: () => delay({ currentStreak: 4, longestStreak: 9 }),
    getUsageWeek: () => delay([
      { label: 'Mon', usedMinutes: 42 }, { label: 'Tue', usedMinutes: 55 },
      { label: 'Wed', usedMinutes: 31 }, { label: 'Thu', usedMinutes: 48 },
      { label: 'Fri', usedMinutes: 26 }, { label: 'Sat', usedMinutes: 12 },
      { label: 'Sun', usedMinutes: 0 },
    ]),
    windowMinimize: () => window.parent?.postMessage({ source: 'dhruvOS', type: 'app-hide' }, location.origin),
    windowClose: () => window.parent?.postMessage({ source: 'dhruvOS', type: 'app-close' }, location.origin),
  };
})();
