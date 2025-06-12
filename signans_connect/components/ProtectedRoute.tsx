'use client';

import { useState } from 'react';

type ProtectedPopupProps = {
  password: string;
  children: React.ReactNode;
};

export default function ProtectedRoute({ password, children }: ProtectedPopupProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === password) {
      setUnlocked(true);
    } else {
      setError('Incorrect password');
    }
  };

  if (!unlocked) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow-lg space-y-4 w-80"
        >
          <h2 className="text-lg font-semibold text-center">Enter Password</h2>
          <input
            type="password"
            className="input input-bordered w-full"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError('');
            }}
            placeholder="Password"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" className="btn btn-primary w-full">
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
