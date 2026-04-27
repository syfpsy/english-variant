import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type DB = SupabaseClient<Database>;
export type { Database } from "./types";

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

/**
 * Factory so each platform (Next.js server/client, Expo) can wire up its
 * own storage adapter without this package having to care.
 */
export function createSupabaseClient(env: SupabaseEnv): DB {
  return createClient<Database>(env.url, env.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
