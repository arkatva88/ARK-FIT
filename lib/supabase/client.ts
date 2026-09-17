import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

/**
 * Returns a cached browser client singleton to avoid reconstructing
 * GoTrue auth clients, event listeners, and socket/HTTP instances on every component render.
 */
export function createClient() {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return browserClient;
}
