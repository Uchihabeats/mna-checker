'use client';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    console.log('Login response:', res);
    if (res?.error) {
      setError('Invalid email or password');
    } else {
      router.push('/dashboard'); // Redirect to dashboard on successful login
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-200">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-indigo-600">Login</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-gray-900 placeholder-gray-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-gray-900 placeholder-gray-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600 transition">Login</button>
        </form>
        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
        <p className="mt-4 text-center text-sm text-gray-500">
          Don't have an account? <a href="/auth/register" className="text-indigo-600 hover:underline">Register</a>
        </p>
      </div>
    </div>
  );
}
