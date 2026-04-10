import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App.jsx';
import LoginPage from './pages/login/loginPage.jsx';

function hasActiveSession() {
  return Boolean(localStorage.getItem('authToken') || localStorage.getItem('isLoggedIn') === 'true');
}

function ProtectedRoute({ children }) {
  return hasActiveSession() ? children : <Navigate to="/loginPage" replace />;
}

const sleep = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

async function waitForBackendReady(maxAttempts = 20, delayMs = 1500) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const healthResponse = await fetch('/api/health', { cache: 'no-store' });

      if (!healthResponse.ok) {
        throw new Error('Backend health endpoint is not ready');
      }

      // Profiles endpoint also exercises database access, not just server liveness.
      const databaseResponse = await fetch('/api/profiles', { cache: 'no-store' });

      if (!databaseResponse.ok) {
        throw new Error('Database is not ready yet');
      }

      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      await sleep(delayMs);
    }
  }
}

function AppBootRoute() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const checkReadiness = async () => {
      setChecking(true);
      setError('');

      try {
        await waitForBackendReady();

        if (!cancelled) {
          setReady(true);
        }
      } catch (checkError) {
        if (!cancelled) {
          setReady(false);
          setError(checkError?.message || 'Backend or database is not ready');
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    checkReadiness();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  if (ready) {
    return <App />;
  }

  return (
    <div className="login-page neon-page">
      <div className="login-card neon-shell auth-card">
        <h2 className="login-title">Preparing App</h2>
        <p style={{ marginTop: 8, marginBottom: 16 }}>
          {checking
            ? 'กำลังรอ backend/database พร้อมใช้งาน...'
            : 'ระบบยังไม่พร้อมใช้งาน'}
        </p>
        {error ? <div className="login-error">{error}</div> : null}
        <button
          className="login-button"
          type="button"
          disabled={checking}
          onClick={() => setRetryKey((prev) => prev + 1)}
        >
          {checking ? 'Checking...' : 'ลองใหม่'}
        </button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/loginPage" replace />} />
        <Route path="/loginPage" element={<LoginPage />} />
        <Route
          path="/app"
          element={(
            <ProtectedRoute>
              <AppBootRoute />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/loginPage" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
