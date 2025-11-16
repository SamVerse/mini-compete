"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context';

export default function MailboxPage() {
  const { token, isAuthenticated } = useAuth();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const fetchMail = async () => {
      try {
        const res = await fetch('http://localhost:3001/users/me/mailbox', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!res.ok) throw new Error('Failed to fetch mailbox');
        
        const data = await res.json();
        setEmails(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMail();
  }, [token, isAuthenticated]);

  if (!isAuthenticated) return <p>Please log in to view your mailbox.</p>;
  if (loading) return <p>Loading mailbox...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Simulated Mailbox</h1>
      {emails.length === 0 ? (
        <p>Your mailbox is empty. Register for a competition to receive a confirmation email!</p>
      ) : (
        <div className="space-y-4">
          {emails.map((mail) => (
            <div key={mail.id} className="p-3 border rounded shadow-sm bg-gray-800">
              <div className="flex justify-between text-sm text-white">
                <span>To: {mail.to}</span>
                <span>{new Date(mail.sentAt).toLocaleString()}</span>
              </div>
              <h2 className="text-lg font-medium text-white">{mail.subject}</h2>
              <p className="text-white mt-5">{mail.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}