import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter username and password.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      await api.post('/auth/login', { username, password });
      // On success, go to dashboard
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
      const msg =
        err?.response?.data?.error ||
        'Login failed. Please check your username and password.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm shadow-lg border border-border">
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold">
            JCDC, CRCC &amp; PMV
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Username
              </label>
              <Input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
                placeholder="JCDCCRCC"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="2034"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-primary hover:bg-red-900 text-primary-foreground"
            >
              {busy ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}