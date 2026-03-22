// src/utils/api.ts
export const testApiKey = async (apiKey: string) => {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'Reply with: OK' }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Invalid API key or network error');
  }
  const data = await res.json();
  return data;
};

export const fetchUsdInr = async () => {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    return data.rates.INR;
  } catch (e) {
    console.error('Failed to fetch USD/INR', e);
    return null;
  }
};

export const fetchSignals = async (apiKey: string, prompt: string) => {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.1, 
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to fetch signals');
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  try {
    // Since we use responseMimeType: "application/json", it should be valid JSON
    return JSON.parse(text);
  } catch (e1) {
    // Fallback regex extraction just in case
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("Raw response:", text);
      throw new Error('Invalid JSON response from Gemini');
    }
    try {
      return JSON.parse(match[0]);
    } catch (e2) {
      console.error("Failed to parse JSON. Raw text:", text);
      throw new Error('Failed to parse JSON response. The data might have been truncated.');
    }
  }
};
