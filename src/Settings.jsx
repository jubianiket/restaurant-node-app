import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function Settings() {
  const [tableCount, setTableCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  return (
    <div style={{ padding: '1rem', maxWidth: '500px' }}>
      <h2>⚙️ Settings</h2>

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

      {message && (
        <div style={{ marginTop: '1rem', color: message.startsWith('✅') ? 'green' : 'red' }}>
          {message}
        </div>
      )}
    </div>
  );
}
