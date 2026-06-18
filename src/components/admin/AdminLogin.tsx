import { useState } from 'react';
import { Shield, User, KeyRound, ChevronRight } from 'lucide-react';

const VALID_IDS = ['Ankit', 'Harith'];
const KEY = '091125';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [id, setId] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    const matchedId = VALID_IDS.find(v => v.toLowerCase() === id.trim().toLowerCase());
    if (!matchedId) {
      setError('ID not recognised.');
      return;
    }
    if (key !== KEY) {
      setError('Incorrect key.');
      return;
    }
    onLoginSuccess();
  }

  return (
    <div className="max-w-lg mx-auto px-6 pt-16 pb-8 flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-6 shadow-lg">
        <Shield className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Enter Room</h1>
      <p className="text-gray-500 text-sm mb-8 text-center">Enter your ID and access key to continue</p>

      <div className="w-full space-y-3">
        <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100">
          <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Player ID"
            value={id}
            onChange={e => { setId(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="flex-1 bg-transparent outline-none text-gray-900 text-base placeholder-gray-400"
            autoFocus
            style={{ fontSize: 16 }}
          />
        </div>

        <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100">
          <KeyRound className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="password"
            placeholder="Access Key"
            value={key}
            onChange={e => { setKey(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="flex-1 bg-transparent outline-none text-gray-900 text-base placeholder-gray-400"
            style={{ fontSize: 16 }}
          />
        </div>

        {error && <p className="text-red-500 text-xs ml-1">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!id.trim() || !key}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold rounded-2xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
