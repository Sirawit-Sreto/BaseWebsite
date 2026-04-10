import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';
import './loginPage.css';

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

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const responseText = await response.text();
      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error('API returned invalid JSON. Please check backend route /api/login');
        }
      }

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.token) {
        throw new Error('Backend did not return a token');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', data.user.email);

      setError('กำลังรอ database พร้อมใช้งาน...');
      await waitForBackendReady();

      navigate('/app');
    } catch (loginError) {
      setError(loginError.message || 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page neon-page">
      <div className="login-card neon-shell auth-card">
        <h2 className="login-title">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="login-field">
            <label htmlFor="Email">Email</label>
            <input
              id="Email"
              type="email"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button className="login-button" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
