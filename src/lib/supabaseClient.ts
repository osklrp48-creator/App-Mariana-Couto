import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isCloudConfigured = Boolean(url && anonKey);

// When env vars are missing (e.g. local dev without a .env file yet) we still
// export a client so imports don't crash; every call will simply fail until
// the project is configured. The app surfaces isCloudConfigured to show a
// clear setup message instead of cryptic network errors.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key"
);
