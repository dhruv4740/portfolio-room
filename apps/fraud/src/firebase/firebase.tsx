import { useSyncExternalStore } from "react";

// The real Firebase auth boundary is kept behind this tiny renderer seam. The
// portfolio copy stays signed in as a clearly labelled demo account so all of
// the original dashboard routes remain browsable without a network project.
export type DemoUser = {
  uid: string;
  displayName: string;
  email: string;
  providerData: Array<{ providerId: string; email: string }>;
};

const demoUser: DemoUser = {
  uid: "demo-fraud-user",
  displayName: "Demo Analyst",
  email: "demo@example.com",
  providerData: [{ providerId: "demo.local", email: "demo@example.com" }],
};

const listeners = new Set<() => void>();
export const auth = {
  currentUser: demoUser as DemoUser | null,
  signOut: async () => {
    auth.currentUser = null;
    listeners.forEach(listener => listener());
  },
};
export const googleProvider = { providerId: "demo.local" };

export function useAuthState(_auth = auth): [DemoUser | null, boolean] {
  const user = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => auth.currentUser,
    () => demoUser,
  );
  return [user, false];
}

export async function signInWithPopup(_auth = auth, _provider = googleProvider) {
  auth.currentUser = demoUser;
  listeners.forEach(listener => listener());
  return { user: demoUser };
}

export async function signOut(_auth = auth) {
  return auth.signOut();
}
