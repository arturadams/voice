import { useState } from 'react';
import {
  resetPasswordWithSupabase,
  signInWithSupabase,
  signUpWithSupabase,
} from '../utils/supabase';

type Mode = 'signIn' | 'signUp' | 'forgot';

export function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function resetMessages() {
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      if (mode === 'signIn') {
        const token = await signInWithSupabase(email, password);
        onLogin(token);
      } else if (mode === 'signUp') {
        const token = await signUpWithSupabase(email, password);
        if (token) {
          onLogin(token);
        } else {
          setMessage('Check your email to confirm your account');
        }
      } else if (mode === 'forgot') {
        await resetPasswordWithSupabase(email);
        setMessage('Password reset email sent');
        setMode('signIn');
      }
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base text-content transition-colors duration-300">
      <form
        onSubmit={handleSubmit}
        className="bg-surface p-6 rounded shadow-md w-full max-w-sm space-y-4 transition-all duration-300"
      >
        <h1 className="text-2xl font-bold text-center">
          {mode === 'signIn' ? 'Sign In' : mode === 'signUp' ? 'Create Account' : 'Reset Password'}
        </h1>
        {error && <div className="text-accent text-sm transition-opacity">{error}</div>}
        {message && <div className="text-primary text-sm transition-opacity">{message}</div>}
        <div>
          <label className="block text-sm mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="w-full px-3 py-2 rounded bg-base text-content border border-subtle focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {mode !== 'forgot' && (
          <div className="transition-all">
            <label className="block text-sm mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="w-full px-3 py-2 rounded bg-base text-content border border-subtle focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-surface py-2 rounded hover:bg-secondary disabled:opacity-50 transition-colors"
        >
          {loading
            ? 'Please wait...'
            : mode === 'forgot'
            ? 'Send Reset Link'
            : mode === 'signIn'
            ? 'Sign In'
            : 'Sign Up'}
        </button>
        <div className="text-center text-sm space-y-1">
          {mode === 'signIn' && (
            <>
              <button
                type="button"
                className="text-primary hover:underline mr-2 transition-colors"
                onClick={() => {
                  setMode('forgot');
                  resetMessages();
                }}
              >
                Forgot password?
              </button>
              <button
                type="button"
                className="text-primary hover:underline transition-colors"
                onClick={() => {
                  setMode('signUp');
                  resetMessages();
                }}
              >
                Create account
              </button>
            </>
          )}
          {mode === 'signUp' && (
            <button
              type="button"
              className="text-primary hover:underline transition-colors"
              onClick={() => {
                setMode('signIn');
                resetMessages();
              }}
            >
              Already have an account?
            </button>
          )}
          {mode === 'forgot' && (
            <button
              type="button"
              className="text-primary hover:underline transition-colors"
              onClick={() => {
                setMode('signIn');
                resetMessages();
              }}
            >
              Back to sign in
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
