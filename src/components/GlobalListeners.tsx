import { useGlobalMessageListener } from "@/hooks/useGlobalMessageListener";

/**
 * Invisible component that mounts global Realtime listeners
 * for in-app message banners (and future global events).
 */
export function GlobalListeners() {
  useGlobalMessageListener();
  return null;
}
