import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../lib/supabase';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Supabase will detect the recovery token/code in the URL and create a session.
    // We just check whether a session exists so we can provide a helpful message.
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) setError(error.message);
      setSessionChecked(true);
      if (!data.session) {
        setError('Invalid or expired recovery link. Please request a new password reset email.');
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMessage('✅ Password updated successfully. Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Update Password | InvoicePro</title>
        <meta name="description" content="Update your InvoicePro password." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6 text-center">
            <img src="/logo.jpg" alt="InvoicePro Logo" className="mx-auto h-12 w-12" />
            <h2 className="text-2xl font-bold text-gray-800 mt-4">Set a New Password</h2>
            <p className="text-sm text-gray-600">Enter your new password below</p>
          </div>

          {!sessionChecked ? (
            <div className="text-sm text-gray-600">Checking recovery link...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">New password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}
              {message && <div className="text-green-600 text-sm">{message}</div>}

              <button
                type="submit"
                disabled={loading || !!error}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          <div className="mt-6 text-sm text-center text-gray-600">
            <Link to="/login" className="text-blue-600 hover:underline">Back to login</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdatePassword;

