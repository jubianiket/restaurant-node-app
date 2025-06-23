import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function Menu() {
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: '',
    portion: 'Full',
    available: true
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    const { data, error } = await supabase
      .from('menu')
      .select('id, name, price, category, portion, available')
      .order('id', { ascending: true });

    if (error) console.error(error);
    else setMenu(data);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price) return;

    const payload = {
      ...form,
      portion: form.portion || 'Full',
      price: Number(form.price)
    };

    if (editingId) {
      await supabase.from('menu').update(payload).eq('id', editingId);
    } else {
      await supabase.from('menu').insert([payload]);
    }

    setForm({ name: '', price: '', category: '', portion: 'Full', available: true });
    setEditingId(null);
    fetchMenu();
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name,
      price: item.price,
      category: item.category,
      portion: item.portion || 'Full',
      available: item.available
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    await supabase.from('menu').delete().eq('id', id);
    fetchMenu();
  };

  const handleToggle = async (item) => {
    await supabase.from('menu').update({ available: !item.available }).eq('id', item.id);
    fetchMenu();
  };

  const filteredMenu = menu.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase()) ||
    item.portion?.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedMenu = filteredMenu.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div style={styles.container}>
      <h2>📋 <b>Manage Menu</b></h2>

      <div style={styles.formRow}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.input} />
        <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={styles.input} />
        <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={styles.input} />
        <select value={form.portion} onChange={(e) => setForm({ ...form, portion: e.target.value })} style={styles.input}>
          <option value="Full">Full</option>
          <option value="Half">Half</option>
          <option value="Regular">Regular</option>
          <option value="Jumbo">Jumbo</option>
        </select>
        <button onClick={handleSubmit} style={{ ...styles.input, backgroundColor: '#1976d2', color: 'white', cursor: 'pointer' }}>
          {editingId ? 'Update' : 'Add'}
        </button>
      </div>

      <input type="text" placeholder="🔍 Search menu..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }} style={styles.searchInput} />

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Portion</th>
              <th style={styles.th}>Available</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMenu.map((item) => (
              <tr key={item.id} style={{ backgroundColor: item.available ? '#fff' : '#fdd' }}>
                <td style={styles.td}>{item.name}</td>
                <td style={styles.td}>₹{item.price}</td>
                <td style={styles.td}>{item.category}</td>
                <td style={styles.td}>{item.portion || 'Full'}</td>
                <td style={styles.td}>
                  <input type="checkbox" checked={item.available} onChange={() => handleToggle(item)} />
                </td>
                <td style={styles.td}>
                  <button onClick={() => handleEdit(item)} style={{ marginRight: '0.5rem' }}>Edit</button>
                  <button onClick={() => handleDelete(item.id)} style={{ color: 'red' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))} disabled={currentPage === 0} style={{ marginRight: '1rem' }}>Previous</button>
        <span><strong>Page {currentPage + 1}</strong></span>
        <button onClick={() => setCurrentPage(prev => (prev + 1) * pageSize < filteredMenu.length ? prev + 1 : prev)} disabled={(currentPage + 1) * pageSize >= filteredMenu.length} style={{ marginLeft: '1rem' }}>Next</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '1.5rem',
    fontFamily: 'Segoe UI, sans-serif',
    maxWidth: '100%',
    overflowX: 'hidden'
  },
  formRow: {
    marginBottom: '1rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  input: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    minWidth: '120px',
    flex: '1 1 auto'
  },
  searchInput: {
    marginBottom: '1rem',
    padding: '0.5rem',
    width: '100%',
    borderRadius: '4px',
    border: '1px solid #ccc',
    boxSizing: 'border-box'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem',
    minWidth: '600px'
  },
  thead: {
    backgroundColor: '#f2f2f2'
  },
  th: {
    padding: '0.5rem',
    borderBottom: '1px solid #ccc',
    textAlign: 'left'
  },
  td: {
    padding: '0.5rem',
    borderBottom: '1px solid #eee'
  }
};
