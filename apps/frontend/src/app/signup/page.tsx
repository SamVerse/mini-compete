"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth-context';

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className="block w-full rounded border border-gray-300 p-2" />
);
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className="block w-full rounded border border-gray-300 p-2" />
);

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const [role, setRole] = useState('PARTICIPANT');

  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:3001/auth/signup', { // <-- Backend URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) throw new Error('Signup failed');

      const { token } = await res.json();
      login(token);
      router.push('/'); 
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="PARTICIPANT">Participant</option>
          <option value="ORGANIZER">Organizer</option>
        </Select>
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">
          Sign Up
        </button>
      </form>
    </div>
  );
}