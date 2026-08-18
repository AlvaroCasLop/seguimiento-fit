import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'seguimiento_fit_supabase_url';
const STORAGE_KEY_KEY = 'seguimiento_fit_supabase_key';

export function getSavedSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const savedUrl = localStorage.getItem(STORAGE_URL_KEY) || envUrl;
  const savedKey = localStorage.getItem(STORAGE_KEY_KEY) || envKey;

  return {
    url: savedUrl.trim(),
    anonKey: savedKey.trim()
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (url) localStorage.setItem(STORAGE_URL_KEY, url.trim());
  else localStorage.removeItem(STORAGE_URL_KEY);

  if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  else localStorage.removeItem(STORAGE_KEY_KEY);
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSavedSupabaseCredentials();
  if (!url || !anonKey || url.includes('tu-proyecto') || anonKey.includes('tu-anon-key')) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }

  return supabaseInstance;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}
