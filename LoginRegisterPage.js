import React, { useState } from 'react';
import axios from 'axios';

const LoginRegisterPage = () => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(url, { email, password });
      // Успешно: сохраняем токен и редиректим
      localStorage.setItem('jwt', response.data.token);
      window.location.href = '/';
    } catch (err) {
      // Если сервер вернул ошибку с message
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Unknown error. Please try again.');
      }
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 32, background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px #0001' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>{mode === 'login' ? 'Login' : 'Register'}</h2>
      {errorMessage && (
        <div style={{ background: '#ffeaea', color: '#c00', padding: '12px 16px', borderRadius: 6, marginBottom: 18, textAlign: 'center', fontWeight: 500 }}>
          {errorMessage}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            required
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc', marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            required
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc', marginTop: 4 }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: 12, borderRadius: 6, background: '#5b9bd5', color: '#fff', fontWeight: 600, border: 'none', fontSize: 16 }}>
          {mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>
      <div style={{ marginTop: 18, textAlign: 'center' }}>
        {mode === 'login' ? (
          <>
            Don't have an account?{' '}
            <button style={{ color: '#5b9bd5', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setMode('register')}>
              Register
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button style={{ color: '#5b9bd5', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setMode('login')}>
              Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginRegisterPage;
