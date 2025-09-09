const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export async function updatePassword(accessToken: string, password: string) {
  const url = `${SUPABASE_URL}/auth/v1/user`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    let message = 'Failed to update password';
    try {
      const data = await res.json();
      message = data.error_description || data.message || message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}
