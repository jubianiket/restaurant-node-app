import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Menu from './Menu';
import Orders from './Orders';
import Settings from './Settings';
import OrderHistory from './OrderHistory';
import Dashboard from './Dashboard';
import { RefreshProvider } from './RefreshContext';

const supabase = createClient(
  'https://iwfunipsnoqfasntaofl.supabase.co',
  'YOUR_PUBLIC_ANON_KEY'
);

export default function App() {
  return (
    <RefreshProvider>
      <Router>
        <AppLayout />
      </Router>
    </RefreshProvider>
  );
}

function SidebarLink({ label, to, collapsed }) {
  const location = useLocation();
  const icon = label.split(' ')[0];
  const isActive = location.pathname === to;

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
        backgroundColor: isActive ? '#1565c0' : 'transparent',
        textAlign: collapsed ? 'center' : 'left'
      }}
    >
      {collapsed ? icon : label}
    </Link>
  );
}

function AppLayout() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [clock, setClock] = useState('');
  const [totalSales, setTotalSales] = useState(0);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user ?? null;
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setRole(profile?.role || '');
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setRole(profile?.role || '');
      }
    });
    return () => listener.subscription.unsubscribe();
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

  useEffect(() => {
    if (window.innerWidth < 768) {
      setCollapsed(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.key === 'b') {
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (!user) return <LoginForm />;

  return (
    <div style={styles.appContainer}>
      <div style={{ ...styles.sidebar, width: collapsed ? '60px' : '240px' }}>
        <button onClick={() => setCollapsed(!collapsed)} style={styles.toggleBtn}>
          {collapsed ? '☰' : '✖'}
        </button>

        <div style={styles.sidebarContent}>
          {!collapsed && <h1 style={styles.logo}>🍽️ POS System</h1>}

          <div style={collapsed ? styles.collapsedText : styles.infoText}>
            🕒 <strong>{!collapsed && clock}</strong>
          </div>

          <div style={{ ...(collapsed ? styles.collapsedText : styles.infoText), marginBottom: '2rem' }}>
            💰 <strong>{!collapsed && `₹${totalSales.toFixed(2)}`}</strong>
          </div>

          {role === 'admin' && <SidebarLink label="📊 Dashboard" to="/dashboard" collapsed={collapsed} />}
          <SidebarLink label="📋 Menu" to="/menu" collapsed={collapsed} />
          <SidebarLink label="🧾 Orders" to="/orders" collapsed={collapsed} />
          <SidebarLink label="📦 History" to="/history" collapsed={collapsed} />
          {role === 'admin' && <SidebarLink label="⚙️ Settings" to="/settings" collapsed={collapsed} />}

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

      <div style={styles.mainContent}>
        <Routes>
          {role === 'admin' && <Route path="/dashboard" element={<Dashboard />} />}
          <Route path="/" element={<Navigate to="/menu" />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/history" element={<OrderHistory />} />
          {role === 'admin' && <Route path="/settings" element={<Settings />} />}
        </Routes>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('staff');

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  };

  const signup = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, role: selectedRole });
    } else if (error) {
      setError(error.message);
    }
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

      <div style={{ marginBottom: '1rem' }}>
        <label>
          <input
            type="radio"
            name="role"
            value="admin"
            checked={selectedRole === 'admin'}
            onChange={(e) => setSelectedRole(e.target.value)}
          /> Admin
        </label>
        <label style={{ marginLeft: '1rem' }}>
          <input
            type="radio"
            name="role"
            value="staff"
            checked={selectedRole === 'staff'}
            onChange={(e) => setSelectedRole(e.target.value)}
          /> Staff
        </label>
      </div>

      <button onClick={login} style={{ ...styles.inputStyle, backgroundColor: '#1976d2', color: 'white' }}>Login</button>
      {selectedRole === 'admin' && (
        <button onClick={signup} style={{ ...styles.inputStyle, backgroundColor: '#555', color: 'white' }}>Sign Up</button>
      )}
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: '100vh',
    width: '100vw',
    overflow: 'hidden',
    fontFamily: 'Segoe UI, sans-serif'
  },
  sidebar: {
    backgroundColor: '#212121',
    color: '#fff',
    transition: 'width 0.3s ease',
    overflowX: 'hidden',
    minHeight: '100vh',
    flexShrink: 0,
    zIndex: 1000
  },
  sidebarContent: {
    padding: '1.5rem 0.5rem',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  toggleBtn: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    zIndex: 2000,
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
    flexGrow: 1,
    padding: '1.5rem',
    backgroundColor: '#f5f5f5',
    overflowY: 'auto',
    width: '100%'
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
