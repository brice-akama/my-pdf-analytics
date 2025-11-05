
      // app/admin/login/page.tsx

      'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const router = useRouter();

  // Login form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/secure-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('authToken', data.token);
      router.push('/admin');
    } else {
      setError(data.error || 'An error occurred');
    }
  };

  // Forgot password submit handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');

    if (!resetEmail) {
      setResetError('Please enter your email');
      return;
    }

    const res = await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email: resetEmail }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (res.ok) {
      setResetMessage('Password reset email sent! Check your inbox.');
    } else {
      setResetError(data.error || 'Failed to send reset email.');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10 p-5 border shadow-lg rounded-md">
      {!forgotPasswordMode ? (
        <>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md">
              Login
            </button>
          </form>
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setForgotPasswordMode(true);
                setResetEmail('');
                setResetMessage('');
                setResetError('');
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        </>
      ) : (
        <>
          {resetMessage && <div className="text-green-600 mb-4">{resetMessage}</div>}
          {resetError && <div className="text-red-500 mb-4">{resetError}</div>}
          <form onSubmit={handleForgotPassword}>
            <div className="mb-4">
              <label className="block mb-1">Enter your admin email to reset password</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <button type="submit" className="w-full bg-green-500 text-white py-2 rounded-md">
              Send Reset Email
            </button>
          </form>
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setForgotPasswordMode(false);
                setError('');
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Back to Login
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LoginPage;