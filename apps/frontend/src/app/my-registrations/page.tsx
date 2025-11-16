"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context';


export default function MyRegistrationsPage() {
  const { token, isAuthenticated } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const fetchRegs = async () => {
      try {
        const res = await fetch('http://localhost:3001/users/me/registrations', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!res.ok) throw new Error('Failed to fetch registrations');
        
        const data = await res.json();
        setRegistrations(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRegs();
  }, [token, isAuthenticated]);

  if (!isAuthenticated) return <p>Please log in to view your registrations.</p>;
  if (loading) return <p>Loading registrations...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Competition Registrations</h1>
      {registrations.length === 0 ? (
        <p>You are not currently registered for any competitions.</p>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <div key={reg.id} className="p-3 border rounded">
              <h2 className="text-xl font-semibold">{reg.competition.title}</h2>
              <p>Registered on: {new Date(reg.registeredAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}