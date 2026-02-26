import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

let currentPasscode = "";

// Export a mutable binding for the Supabase client so callers can import
// and continue to reference the (re)initialized client.
export let supabase;

// Initialize or re-create the Supabase client with an optional passcode.
// If called repeatedly with the same passcode, this is a no-op.
export function initializeSupabase(passcode = "") {
  if (supabase && passcode === currentPasscode) return supabase;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in your .env file."
    );
  }

  const headers: Record<string, string> = {};
  if (passcode) headers["x-bakeoff-passcode"] = passcode;

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers }
  });

  currentPasscode = passcode;
  return supabase;
}

// Backwards-compatible alias used in some files
export function setSupabasePasscode(passcode) {
  return initializeSupabase(passcode);
}

// Helper to get headers for manual fetch calls
export function getRequestHeaders() {
  const headers = {};
  if (currentPasscode) headers["x-bakeoff-passcode"] = currentPasscode;
  return headers;
}
