import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
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
  const [clock, setClock] = useState('');
  const [totalSales, setTotalSales] = useState(0);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);

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
  }, []);

  if (!user) return <LoginForm />;

  return (
    <>
      {/* ✅ Toggle Button outside sidebar for visibility */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={styles.toggleBtn}
      >
        {collapsed ? '☰' : '✖'}
      </button>

      <Router>
        <div style={styles.appContainer}>
          {/* Sidebar */}
          <div style={{ ...styles.sidebar, width: collapsed ? '60px' : '240px' }}>
            <div style={styles.sidebarContent}>
              {!collapsed && <h1 style={styles.logo}>🍽️ POS System</h1>}

              <div style={collapsed ? styles.collapsedText : styles.infoText}>
                🕒 <strong>{!collapsed && clock}</strong>
              </div>

              <div style={{ ...(collapsed ? styles.collapsedText : styles.infoText), marginBottom: '2rem' }}>
                💰 <strong>{!collapsed && `₹${totalSales.toFixed(2)}`}</strong>
              </div>

              <SidebarLink label="📋 Menu" to="/menu" collapsed={collapsed} />
              <SidebarLink label="🧾 Orders" to="/orders" collapsed={collapsed} />
              <SidebarLink label="📦 History" to="/history" collapsed={collapsed} />
              <SidebarLink label="⚙️ Settings" to="/settings" collapsed={collapsed} />

              <div style={{ marginTop: 'auto' }}>
                <button
                  onClick={async () => await supabase.auth.signOut()}
                  style={styles.logoutBtn}
                >
                  {collapsed ? '🚪' : '🚪 Logout'}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={styles.mainContent}>
            <Routes>
              <Route path="/" element={<Navigate to="/menu" />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/history" element={<OrderHistory />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </Router>
    </>
  );
}

function SidebarLink({ label, to, collapsed }) {
  const icon = label.split(' ')[0];
  return (
    <Link
      to={to}
      style={{
        display: 'block',
        color: '#fff',
        textDecoration: 'none',
        padding: '0.75rem 1rem',
        borderRadius: '6px',
        marginBottom: '0.5rem',
        transition: 'background 0.3s',
        fontSize: '1rem',
        backgroundColor: window.location.pathname === to ? '#1565c0' : 'transparent',
        textAlign: collapsed ? 'center' : 'left'
      }}
    >
      {collapsed ? icon : label}
    </Link>
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
    height: '100vh',
    fontFamily: 'Segoe UI, sans-serif'
  },
  sidebar: {
    position: 'relative',
    backgroundColor: '#212121',
    color: '#fff',
    transition: 'width 0.3s ease',
    overflowX: 'hidden',
    height: '100vh',
    zIndex: 1000
  },
  sidebarContent: {
    padding: '1.5rem 0.5rem',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  toggleBtn: {
    position: 'fixed',
    top: '1rem',
    left: '1rem',
    zIndex: 3000,
    backgroundColor: '#1565c0',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 0.8rem',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  logo: {
    marginBottom: '1.5rem',
    fontSize: '1.5rem',
    textAlign: 'center'
  },
  infoText: {
    marginBottom: '1rem',
    fontSize: '1rem',
    paddingLeft: '1rem'
  },
  collapsedText: {
    marginBottom: '1rem',
    fontSize: '1.5rem',
    textAlign: 'center'
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
    padding: '2rem'
  },
  inputStyle: {
    padding: '0.75rem',
    marginBottom: '1rem',
    width: '100%',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  logoutBtn: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#d32f2f',
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
    textAlign: 'center'
  }
};
