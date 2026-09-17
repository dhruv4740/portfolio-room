// Portfolio build: the same `bff` client the components use, but every request
// is answered in-browser by lib/mock/router.ts (ky lets a beforeRequest hook
// return a Response). Components, stores and hooks are unchanged.
import ky from "ky";
import { handle, installMockEventSource } from "./mock/router";

installMockEventSource();

export const bff = ky.create({
  prefixUrl: "/api",
  timeout: 60000,
  retry: 0,
  hooks: { beforeRequest: [(request) => handle(request)] },
});
