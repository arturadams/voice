import { useState } from 'react';
import { updatePassword } from '../services/supabase';

interface Props {
  accessToken: string;
  onComplete?: () => void;
}

export function ResetPassword({ accessToken, onComplete }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      await updatePassword(accessToken, password);
      setDone(true);
      setError(null);
      onComplete?.();
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm p-4 text-center">
        <p className="mb-4">Password updated successfully.</p>
        <p>You may now close this tab.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-sm space-y-4 p-4">
      <input
        type="password"
        placeholder="New password"
        className="w-full rounded border border-base-300 p-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm password"
        className="w-full rounded border border-base-300 p-2"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {error && <p className="text-error text-sm">{error}</p>}
      <button type="submit" className="btn btn-primary w-full">
        Set Password
      </button>
    </form>
  );
}
