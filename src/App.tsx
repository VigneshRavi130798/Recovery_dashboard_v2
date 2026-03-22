/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ApiSetup from './components/ApiSetup';
import Dashboard from './components/Dashboard';

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini_api_key'));

  const handleSaveKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey(null);
  };

  if (!apiKey) {
    return <ApiSetup onSave={handleSaveKey} />;
  }

  return <Dashboard apiKey={apiKey} onClearKey={handleClearKey} />;
}
