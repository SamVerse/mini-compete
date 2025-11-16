"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from "./context/auth-context";


const Button = ({ href, children }: { href: string, children: React.ReactNode }) => (
  <Link href={href} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
    {children}
  </Link>
);


const LogoutButton = () => {
  const { logout } = useAuth();
  return (
    <button type='button' onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
      Log Out
    </button>
  );
};




// --- Main Page Component ---
export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div>
      <Header />
      
      {!isAuthenticated && <GuestView />}
      
      {isAuthenticated && user?.role === 'PARTICIPANT' && <ParticipantView />}
      
      {isAuthenticated && user?.role === 'ORGANIZER' && <OrganizerView />}
    </div>
  );
}

// --- Views ---
const Header = () => {
  const { user, isAuthenticated } = useAuth();
  return (
    <nav className="flex justify-between items-center mb-6 p-4 bg-gray-600 text-white rounded">
      <h1 className="text-xl font-bold">Mini Compete</h1>
      <div className="space-x-8">
        {isAuthenticated ? (
          <>
            <span>Hi, {user?.email} ({user?.role})</span>
            {user?.role === 'PARTICIPANT' && (
              <>
                <Link href="/my-registrations" className="text-white">My Registrations</Link>
                <Link href="/mailbox" className="text-white">Mailbox</Link>
              </>
            )}
            <LogoutButton />
          </>
        ) : (
          <>
            <Button href="/login">Login</Button>
            <Button href="/signup">Sign Up</Button>
          </>
        )}
      </div>
    </nav>
  );
};

const GuestView = () => (
  <div>
    <h2 className="text-2xl mb-4">Welcome!</h2>
    <p>Please log in or sign up to register for competitions.</p>
    <CompetitionList />
  </div>
);

const ParticipantView = () => {
  return (
    <div>
      <h2 className="text-2xl mb-4">Available Competitions</h2>
      <CompetitionList />
    </div>
  );
};


const CreateCompetitionForm = ({ token }: { token: string | null }) => {
  const [title, setTitle] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [deadline, setDeadline] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('http://localhost:3001/competitions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          title, 
          description: "Default description.", 
          capacity: parseInt(capacity.toString(), 10), 
          regDeadline: new Date(deadline).toISOString() 
        }),
      });

      if (!res.ok) throw new Error('Failed to create competition');

      const data = await res.json();
      setMessage(`Competition created successfully (ID: ${data.id})`);
      setTitle(''); setCapacity(1); setDeadline('');

    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    }
  };

  return (
    <div className="p-4 border rounded shadow-md mt-6">
      <h3 className="text-xl font-semibold mb-3">Create New Competition</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="block w-full border p-2" />
        <input type="number" placeholder="Capacity" value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value, 10))} required min="1" className="block w-full border p-2" />
        <input type="date" placeholder="Registration Deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} required className="block w-full border p-2" />
        <button type="submit" className="bg-purple-600 text-white p-2 rounded">Create</button>
        {message && <p className="text-sm">{message}</p>}
      </form>
    </div>
  );
};


const OrganizerView = () => {
  const { token } = useAuth();
  return (
    <div>
      <h2 className="text-2xl mb-4">Your Organizer Dashboard</h2>
      <CreateCompetitionForm token={token} />
    </div>
  );
};

// --- Shared Competition List ---
const CompetitionList = () => {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const { user, token } = useAuth();

  useEffect(() => {
    const fetchComps = async () => {
      const res = await fetch('http://localhost:3001/competitions'); // <-- GET all
      const data = await res.json();
      setCompetitions(data);
    };
    fetchComps();
  }, []);

  const handleRegister = async (id: number) => {
    if (!token) {
      alert("Please log in to register.");
      return;
    }
    
    const idempotencyKey = `register-${id}-${Date.now()}`;
    
    try {
      const res = await fetch(`http://localhost:3001/competitions/${id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Idempotency-Key': idempotencyKey,
        },
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      alert('Registration successful!');

    } catch (err) {
      alert(`Error: ${(err as Error).message}`);
    }
  };

  return (
    <div className="space-y-4">
      {competitions.map((comp) => (
        <div key={comp.id} className="p-4 border rounded shadow-sm">
          <h3 className="text-xl font-semibold">{comp.title}</h3>
          <p>{comp.description}</p>
          <p><strong>Capacity:</strong> {comp.capacity}</p>
          <p><strong>Deadline:</strong> {new Date(comp.regDeadline).toLocaleDateString()}</p>
          {user?.role === 'PARTICIPANT' && (
            <button
            type='button' 
              onClick={() => handleRegister(comp.id)}
              className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
            >
              Register
            </button>
          )}
        </div>
      ))}
    </div>
  );
};