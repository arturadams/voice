import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export async function signInWithSupabase(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('No access token returned');
  return token;
}

export async function signUpWithSupabase(email: string, password: string): Promise<string | null> {
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
  return data.session?.access_token || null;
}

export async function resetPasswordWithSupabase(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

