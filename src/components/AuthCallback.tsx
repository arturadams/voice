import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export function AuthCallback() {
  const [isRecovery, setIsRecovery] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const code = params.get('code');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = params.get('type') || hashParams.get('type');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) console.error('exchange error', error);
      } else if (accessToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        });
        if (error) console.error('session error', error);
      } else {
        window.location.replace('/');
        return;
      }

      if (type === 'recovery' || (!type && accessToken)) {
        setIsRecovery(true);
      } else {
        window.location.replace('/');
      }
    };
    run();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('Password updated');
      setTimeout(() => window.location.replace('/'), 1500);
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  if (!isRecovery) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base text-content transition-colors duration-300">
      <form
        onSubmit={handleSubmit}
        className="bg-surface p-6 rounded shadow-md w-full max-w-sm space-y-4 transition-all duration-300"
      >
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>
        {error && <div className="text-accent text-sm transition-opacity">{error}</div>}
        {message && <div className="text-primary text-sm transition-opacity">{message}</div>}
        <div>
          <label className="block text-sm mb-1" htmlFor="password">New Password</label>
          <input
            id="password"
            type="password"
            className="w-full px-3 py-2 rounded bg-base text-content border border-subtle focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="confirm">Confirm Password</label>
          <input
            id="confirm"
            type="password"
            className="w-full px-3 py-2 rounded bg-base text-content border border-subtle focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-surface py-2 rounded hover:bg-secondary disabled:opacity-50 transition-colors"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
