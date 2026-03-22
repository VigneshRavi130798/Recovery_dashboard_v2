import React, { useState } from 'react';
import { testApiKey } from '../utils/api';
import { KeyRound, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

export default function ApiSetup({ onSave }: { onSave: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleValidate = async () => {
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    try {
      await testApiKey(key.trim());
      onSave(key.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to validate key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f3] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-gray-100">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <KeyRound className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Connect your Gemini API key</h1>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          This dashboard uses <span className="font-medium text-gray-900">gemini-2.0-flash</span> on the free tier. 
          <strong className="text-red-600 block mt-1">NO billing required. Do NOT enable billing.</strong>
        </p>

        <div className="space-y-4 mb-8">
          <h3 className="text-sm font-medium text-gray-900">Instructions:</h3>
          <ol className="text-sm text-gray-600 space-y-3 list-decimal pl-4">
            <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3"/></a></li>
            <li>Sign in with your Google account</li>
            <li>Click <strong>Create API key</strong></li>
            <li>Select an existing project or create a new one</li>
            <li>Copy the generated key and paste it below</li>
          </ol>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              id="apiKey"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="break-words">{error}</p>
            </div>
          )}

          <button
            onClick={handleValidate}
            disabled={!key.trim() || loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Validate & Launch'}
          </button>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            Your key is saved locally in your browser and only sent directly to Google's API.
          </p>
        </div>
      </div>
    </div>
  );
}
