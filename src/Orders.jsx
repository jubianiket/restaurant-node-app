import React, { useEffect, useState, useContext } from 'react';
import { supabase } from './supabaseClient';
import { RefreshContext } from './RefreshContext';

export default function Orders() {
  const { refreshFlag } = useContext(RefreshContext);

  const [menu, setMenu] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [orderType, setOrderType] = useState('dine-in');
  const [tableNo, setTableNo] = useState('');
  const [phone, setPhone] = useState('');
  const [building, setBuilding] = useState('');
  const [flat, setFlat] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 3;

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [refreshFlag]);

  const fetchMenu = async () => {
    const { data, error } = await supabase
      .from('menu')
      .select('id, name, price, category, portion, available')
      .eq('available', true);
    if (error) console.error(error);
    else setMenu(data);
  };

  const toggleItem = (item) => {
    const exists = selectedItems.find(i => i.id === item.id);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const fetchPreviousDeliveryByPhone = async (phone) => {
    const { data, error } = await supabase
      .from('orders')
      .select('building_no, flat_no')
      .eq('phone_no', phone)
      .eq('type', 'delivery')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      setBuilding(data.building_no);
      setFlat(data.flat_no);
    }
  };

  const fetchPreviousDeliveryByAddress = async (building, flat) => {
    const { data, error } = await supabase
      .from('orders')
      .select('phone_no')
      .eq('building_no', building)
      .eq('flat_no', flat)
      .eq('type', 'delivery')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      setPhone(data.phone_no);
    }
  };

  const placeOrder = async () => {
    if (selectedItems.length === 0) return alert('Select at least one item');
    if (orderType === 'dine-in' && !tableNo) return alert('Select table number');
    if (orderType === 'delivery' && (!phone || !building || !flat)) return alert('Fill delivery details');

    setLoading(true);

    const { error } = await supabase.from('orders').insert([{
      items: selectedItems,
      type: orderType,
      table_no: orderType === 'dine-in' ? parseInt(tableNo) : null,
      phone_no: orderType === 'delivery' ? phone : null,
      building_no: orderType === 'delivery' ? building : null,
      flat_no: orderType === 'delivery' ? flat : null,
      status: 'received'
    }]);

    if (error) console.error(error.message);

    setSelectedItems([]);
    setTableNo('');
    setPhone('');
    setBuilding('');
    setFlat('');
    setLoading(false);
  };

  const categories = [...new Set(menu.map(item => item.category))];
  const filteredMenu = menu.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
  const paginatedCategories = categories.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div style={styles.outerWrap}>
      <div style={styles.sidebar}>🍽️ <b>Sidebar</b></div>
      <div style={styles.container}>
        <h2 style={styles.header}>🧾 <b>Manage Orders</b></h2>

        <div style={styles.section}>
          <label><strong>Order Type:</strong></label>
          <div>
            <label>
              <input type="radio" value="dine-in" checked={orderType === 'dine-in'} onChange={(e) => setOrderType(e.target.value)} /> Dine-in
            </label>
            <label style={{ marginLeft: '1rem' }}>
              <input type="radio" value="delivery" checked={orderType === 'delivery'} onChange={(e) => setOrderType(e.target.value)} /> Delivery
            </label>
          </div>
        </div>

        {orderType === 'dine-in' && (
          <div style={styles.section}>
            <label><strong>Select Table:</strong></label>
            <div style={styles.gridWrap}>
              {[...Array(16)].map((_, i) => {
                const num = i + 1;
                return (
                  <button
                    key={num}
                    onClick={() => setTableNo(num)}
                    style={{ ...styles.tableButton, backgroundColor: tableNo === num ? '#4caf50' : '#1976d2' }}>
                    Table {num}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {orderType === 'delivery' && (
          <div style={styles.section}>
            <input
              type="text"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => {
                const newPhone = e.target.value;
                setPhone(newPhone);
                if (newPhone.length >= 10) {
                  fetchPreviousDeliveryByPhone(newPhone);
                }
              }}
              style={styles.inputFull}
            />
            <div style={styles.gridTwo}>
              <select
                value={building}
                onChange={(e) => {
                  const newBuilding = e.target.value;
                  setBuilding(newBuilding);
                  if (newBuilding && flat) fetchPreviousDeliveryByAddress(newBuilding, flat);
                }}
                style={styles.select}>
                <option value="">Select Building</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
              <select
                value={flat}
                onChange={(e) => {
                  const newFlat = e.target.value;
                  setFlat(newFlat);
                  if (building && newFlat) fetchPreviousDeliveryByAddress(building, newFlat);
                }}
                style={styles.select}>
                <option value="">Select Flat</option>
                <option value="101">101</option>
                <option value="102">102</option>
                <option value="201">201</option>
                <option value="202">202</option>
              </select>
            </div>
          </div>
        )}

        <input type="text" placeholder="🔍 Search items..." value={search} onChange={(e) => setSearch(e.target.value)} style={styles.inputFull} />

        <button onClick={placeOrder} disabled={loading} style={styles.orderBtn}>
          {loading ? 'Placing...' : '📦 Place Order'}
        </button>

        <div style={styles.menuGrid}>
          {paginatedCategories.map(category => {
            const categoryItems = filteredMenu.filter(item => item.category === category);
            if (categoryItems.length === 0) return null;
            return (
              <div key={category} style={styles.card}>
                <h4 style={styles.cardTitle}>{category}</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Price</th>
                        <th style={styles.th}>Portion</th>
                        <th style={styles.th}>Select</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryItems.map(item => (
                        <tr key={item.id} style={{ background: selectedItems.find(i => i.id === item.id) ? '#dff0d8' : 'white' }}>
                          <td style={styles.td}>{item.name}</td>
                          <td style={styles.td}>₹{item.price}</td>
                          <td style={styles.td}>{item.portion || 'N/A'}</td>
                          <td style={styles.td}>
                            <button onClick={() => toggleItem(item)} style={styles.actionBtn}>
                              {selectedItems.find(i => i.id === item.id) ? 'Remove' : 'Add'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button onClick={() => setPage(prev => Math.max(prev - 1, 0))} disabled={page === 0} style={styles.pageBtn}>Previous</button>
          <span><strong>Page {page + 1}</strong></span>
          <button onClick={() => setPage(prev => (prev + 1) * pageSize < categories.length ? prev + 1 : prev)} disabled={(page + 1) * pageSize >= categories.length} style={styles.pageBtn}>Next</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  outerWrap: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    width: '100%',
    minHeight: '100vh',
    overflowX: 'hidden'
  },
  sidebar: {
    minWidth: '150px',
    background: '#f2f2f2',
    padding: '1rem',
    fontWeight: 'bold',
    flexShrink: 0
  },
  container: {
    padding: '1.5rem',
    fontFamily: 'Segoe UI, sans-serif',
    flexGrow: 1
  },
  header: { marginBottom: '1rem' },
  section: { marginBottom: '1rem' },
  select: { padding: '0.5rem', flex: 1 },
  inputFull: { marginBottom: '1rem', padding: '0.5rem', width: '100%' },
  gridWrap: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' },
  tableButton: { padding: '0.5rem 1rem', color: '#fff', border: 'none', borderRadius: '4px' },
  gridTwo: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  orderBtn: { marginBottom: '1rem', padding: '0.6rem 1.2rem', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', width: '100%' },
  menuGrid: { display: 'flex', flexWrap: 'wrap', gap: '1rem' },
  card: { flex: '1 1 100%', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' },
  cardTitle: { marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '0.5rem', textAlign: 'left', background: '#f2f2f2' },
  td: { padding: '0.5rem' },
  actionBtn: { padding: '0.25rem 0.5rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' },
  pageBtn: { padding: '0.5rem 1rem', margin: '0 1rem' }
};
