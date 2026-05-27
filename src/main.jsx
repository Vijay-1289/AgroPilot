import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { useStageStore } from './store/stageStore';

// GLOBAL PREMIUM FETCH INTERCEPTOR FOR TOKENS MANAGEMENT
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  if (typeof url === 'string' && url.startsWith('/api/')) {
    const state = useStageStore.getState();
    const { tokenBalance, useSimulationMode, deductTokens, setError, customApiKey } = state;
    
    // 1. Check if token budget is exhausted before executing (Bypassed if custom API Key is active)
    if (tokenBalance <= 0 && !customApiKey) {
      setError('AI_CAPACITY_LIMIT_EXCEEDED');
      throw new Error('AI_CAPACITY_LIMIT_EXCEEDED');
    }

    // 2. Automatically inject dynamic simulation and custom API key headers
    options.headers = {
      ...options.headers,
      'x-simulation-mode': useSimulationMode ? 'true' : 'false',
      ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {})
    };

    try {
      const response = await originalFetch(url, options);
      
      // 3. Catch backend API block/errors
      if (!response.ok) {
        const errData = await response.clone().json().catch(() => ({}));
        const errMsg = errData.error || response.statusText;
        if (errMsg === 'AI_CAPACITY_LIMIT_EXCEEDED') {
          setError('AI_CAPACITY_LIMIT_EXCEEDED');
          throw new Error('AI_CAPACITY_LIMIT_EXCEEDED');
        }
        return response;
      }

      // 4. Successful generation -> Deduct tokens based on standard stage weights
      let tokenCost = 10000;
      
      if (url.includes('/api/stage1/analyze')) tokenCost = 12500;
      else if (url.includes('/api/stage3/plan')) tokenCost = 18000;
      else if (url.includes('/api/stage4/irrigate')) tokenCost = 15000;
      else if (url.includes('/api/stage5/seeding')) tokenCost = 14000;
      else if (url.includes('/api/stage6/checkup')) tokenCost = 9500;
      else if (url.includes('/api/stage7/diagnose')) tokenCost = 16000;
      else if (url.includes('/api/stage8/harvest')) tokenCost = 13500;
      else if (url.includes('/api/stage9/storage')) tokenCost = 14500;
      else if (url.includes('/api/stage10/market')) tokenCost = 15500;

      deductTokens(tokenCost);

      return response;
    } catch (err) {
      if (err.message === 'AI_CAPACITY_LIMIT_EXCEEDED') {
        setError('AI_CAPACITY_LIMIT_EXCEEDED');
      }
      throw err;
    }
  }

  return originalFetch(url, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
