import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function Settings() {
  const [tableCount, setTableCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffMessage, setStaffMessage] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('settings').select('*').single();
    if (error) {
      console.error('Fetch error:', error.message);
      setTableCount(10); // fallback default
    } else {
      setTableCount(data.table_count);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    setMessage('');

    const { error } = await supabase
      .from('settings')
      .upsert({ id: 1, table_count: parseInt(tableCount, 10) }, { onConflict: ['id'] });

    if (error) {
      console.error('Save error:', error.message);
      setMessage('❌ Failed to save settings.');
    } else {
      setMessage('✅ Settings saved successfully!');
    }

    setLoading(false);
  };

  const createStaffAccount = async () => {
    setStaffLoading(true);
    setStaffMessage('');

    const { data, error } = await supabase.auth.signUp({
      email: staffEmail,
      password: staffPassword
    });

    if (error) {
      console.error('Sign up error:', error.message);
      setStaffMessage(`❌ ${error.message}`);
    } else if (data?.user) {
      // Insert role into profiles table using the UID
      const userId = data.user.id;
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        role: 'staff'
      });

      if (profileError) {
        console.error('Profile insert error:', profileError.message);
        setStaffMessage('❌ Created user, but failed to save role.');
      } else {
        setStaffMessage('✅ Staff account created. Please confirm via email.');
      }
    }

    setStaffEmail('');
    setStaffPassword('');
    setStaffLoading(false);
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '600px' }}>
      <h2>⚙️ Settings</h2>

      {/* Table Count Setting */}
      <label>Number of Dine-in Tables:</label>
      <input
        type="number"
        value={tableCount}
        onChange={(e) => setTableCount(e.target.value)}
        style={{ padding: '0.5rem', width: '100%', marginTop: '0.5rem', marginBottom: '1rem' }}
      />
      <button
        onClick={saveSettings}
        disabled={loading}
        style={{ padding: '0.5rem 1rem' }}
      >
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
      {message && <div style={{ marginTop: '1rem', color: message.startsWith('✅') ? 'green' : 'red' }}>{message}</div>}

      {/* Divider */}
      <hr style={{ margin: '2rem 0' }} />

      {/* Staff Registration Form */}
      <h3>👤 Create Staff Account</h3>
      <input
        type="email"
        placeholder="Staff Email"
        value={staffEmail}
        onChange={(e) => setStaffEmail(e.target.value)}
        style={{ ...inputStyle, marginBottom: '0.5rem' }}
      />
      <input
        type="password"
        placeholder="Password"
        value={staffPassword}
        onChange={(e) => setStaffPassword(e.target.value)}
        style={{ ...inputStyle, marginBottom: '0.5rem' }}
      />
      <button
        onClick={createStaffAccount}
        disabled={staffLoading}
        style={{ ...inputStyle, backgroundColor: '#1976d2', color: 'white', cursor: 'pointer' }}
      >
        {staffLoading ? 'Creating...' : 'Create Staff'}
      </button>
      {staffMessage && <div style={{ marginTop: '1rem', color: staffMessage.startsWith('✅') ? 'green' : 'red' }}>{staffMessage}</div>}
    </div>
  );
}

const inputStyle = {
  padding: '0.5rem',
  width: '100%',
  borderRadius: '4px',
  border: '1px solid #ccc',
  boxSizing: 'border-box'
};
