import { useEffect } from 'react';
import { supabase } from '../utils/supabase';

export function AuthCallback() {
  useEffect(() => {
    const run = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) console.error('exchange error', error);
      }
      window.location.replace('/');
    };
    run();
  }, []);

  return null;
}
