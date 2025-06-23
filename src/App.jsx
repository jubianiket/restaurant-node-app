import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Menu from './Menu';
import Orders from './Orders';
import Settings from './Settings';
import OrderHistory from './OrderHistory';

const supabase = createClient(
  'https://iwfunipsnoqfasntaofl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZnVuaXBzbm9xZmFzbnRhb2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NzU1MjQsImV4cCI6MjA2NjI1MTUyNH0.E2YU0wDS16TUsIbX8qIM3Xo6XZF3Z_GuWFUmjWw7Z7A'
);

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('menu');
  const [clock, setClock] = useState('');
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setClock(`${hours}:${minutes}:${seconds} ${ampm}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchTotalSales = async () => {
      const { data, error } = await supabase.from('orders').select('*');
      if (!error && data) {
        const total = data.reduce((sum, order) => {
          return sum + order.items.reduce((s, i) => s + Number(i.price || 0), 0);
        }, 0);
        setTotalSales(total);
      }
    };
    fetchTotalSales();
  }, [view]);

  if (!user) return <LoginForm />;

  return (
    <div style={styles.appContainer}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h1 style={styles.logo}>🍽️ POS System</h1>
        <div style={styles.infoText}>🕒 <strong>{clock}</strong></div>
        <div style={{ ...styles.infoText, marginBottom: '2rem' }}>💰 <strong>₹{totalSales.toFixed(2)}</strong></div>

        <SidebarButton label="📋 Menu" active={view === 'menu'} onClick={() => setView('menu')} />
        <SidebarButton label="🧾 Orders" active={view === 'orders'} onClick={() => setView('orders')} />
        <SidebarButton label="📦 History" active={view === 'history'} onClick={() => setView('history')} />
        <SidebarButton label="⚙️ Settings" active={view === 'settings'} onClick={() => setView('settings')} />

        <div style={{ marginTop: 'auto' }}>
          <SidebarButton label="🚪 Logout" danger onClick={async () => await supabase.auth.signOut()} />
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {view === 'menu' && <Menu />}
        {view === 'orders' && <Orders />}
        {view === 'history' && <OrderHistory />}
        {view === 'settings' && <Settings />}
      </div>
    </div>
  );
}

function SidebarButton({ label, active, danger = false, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: active ? '#1565c0' : danger ? '#d32f2f' : 'transparent',
        color: '#fff',
        border: 'none',
        padding: '0.75rem 1rem',
        textAlign: 'left',
        cursor: 'pointer',
        marginBottom: '0.5rem',
        borderRadius: '6px',
        fontSize: '1rem',
        transition: 'background 0.3s',
        width: '100%'
      }}
    >
      {label}
    </button>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  };

  const signup = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
  };

  return (
    <div style={styles.loginContainer}>
      <h2 style={{ marginBottom: '1rem' }}>🔐 Login / Sign Up</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.inputStyle}
      /><br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.inputStyle}
      /><br />
      <button onClick={login} style={{ ...styles.inputStyle, backgroundColor: '#1976d2', color: 'white' }}>Login</button>
      <button onClick={signup} style={{ ...styles.inputStyle, backgroundColor: '#555', color: 'white' }}>Sign Up</button>
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: window.innerWidth < 768 ? 'column' : 'row',
    height: '100vh',
    fontFamily: 'Segoe UI, sans-serif'
  },
  sidebar: {
    width: window.innerWidth < 768 ? '100%' : '240px',
    backgroundColor: '#212121',
    color: '#fff',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
  },
  logo: {
    marginBottom: '2rem',
    fontSize: '1.5rem'
  },
  infoText: {
    marginBottom: '1rem',
    fontSize: '1rem'
  },
  mainContent: {
    flex: 1,
    padding: '1.5rem',
    backgroundColor: '#f5f5f5',
    overflowY: 'auto'
  },
  loginContainer: {
    maxWidth: '400px',
    margin: 'auto',
    padding: '2rem',
    fontFamily: 'Segoe UI, sans-serif'
  },
  inputStyle: {
    padding: '0.75rem',
    marginBottom: '1rem',
    width: '100%',
    boxSizing: 'border-box',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ccc'
  }
};
