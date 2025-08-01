import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 4;

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [statusFilter, searchTerm, orders]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error.message);
    } else {
      setOrders(data || []);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.items?.some(item => item.name.toLowerCase().includes(lower)) ||
        (order.table_no && order.table_no.toString().includes(lower)) ||
        order.type.toLowerCase().includes(lower) ||
        (order.phone_no && order.phone_no.toLowerCase().includes(lower)) ||
        (order.building_no && order.building_no.toLowerCase().includes(lower)) ||
        (order.flat_no && order.flat_no.toLowerCase().includes(lower))
      );
    }
    setFilteredOrders(filtered);
  };

  const togglePaymentStatus = async (order) => {
    const newPayment = order.payment_status === 'done' ? 'unpaid' : 'done';
    const { error } = await supabase.from('orders').update({ payment_status: newPayment }).eq('id', order.id);
    if (error) console.error(error.message);
    else fetchOrders();
  };

  const toggleOrderStatus = async (order) => {
    const newStatus = order.status === 'received' ? 'completed' : 'received';
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    if (error) console.error(error.message);
    else fetchOrders();
  };

  const deleteOrder = async (id) => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) console.error(error.message);
    else fetchOrders();
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + Number(item.price || 0), 0);
  };

  const formatDateTime = (isoDate) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    return date.toLocaleString('en-IN', { hour12: true });
  };

  const paginatedOrders = filteredOrders.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div style={{ padding: '1rem', fontFamily: 'Segoe UI, sans-serif', maxWidth: '100%', overflowX: 'hidden' }}>
      <h2 style={{ marginBottom: '1rem' }}><b>📦 Order History</b></h2>

      <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.5rem' }}>
          <option value="all">All</option>
          <option value="received">Received</option>
          <option value="completed">Completed</option>
        </select>

        <input
          type="text"
          placeholder="Search by item, table, phone, building, or flat"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '0.5rem' }}
        />

        <span><strong>Total Orders:</strong> {filteredOrders.length}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {paginatedOrders.map(order => (
          <div key={order.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', background: '#fff' }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
              #{order.id} | {order.type === 'dine-in' ? `Table ${order.table_no}` : 'Delivery'} |
               ORDER STATUS<span style={{ color: order.status === 'completed' ? 'green' : 'orange', marginLeft: '0.5rem' }}>
                 {order.status?.toUpperCase()}
              </span>
              | PAYMENT STATUS <span style={{ color: order.payment_status === 'done' ? 'green' : 'orange', marginLeft: '0.5rem' }}>
               {order.payment_status?.toUpperCase()}
              </span>
              <span style={{ float: 'right', fontSize: '0.9rem', color: '#666' }}>
                {formatDateTime(order.timestamp)}
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.5rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ textAlign: 'left', padding: '0.25rem' }}>Item</th>
                  <th style={{ textAlign: 'left', padding: '0.25rem' }}>Price</th>
                  <th style={{ textAlign: 'left', padding: '0.25rem' }}>Qty</th>
                  <th style={{ textAlign: 'left', padding: '0.25rem' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '0.25rem' }}>{item.name}</td>
                    <td style={{ padding: '0.25rem' }}>₹{item.price}</td>
                    <td style={{ padding: '0.25rem' }}>1</td>
                    <td style={{ padding: '0.25rem' }}>₹{Number(item.price || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Total Bill: ₹{calculateTotal(order.items).toFixed(2)}</div>

            {order.type === 'delivery' && (
              <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#333' }}>
                <div><strong>📞 Phone:</strong> {order.phone_no || '-'}</div>
                <div><strong>🏢 Building:</strong> {order.building_no || '-'}</div>
                <div><strong>🏠 Flat:</strong> {order.flat_no || '-'}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => togglePaymentStatus(order)} style={{ flex: 1, padding: '0.5rem', backgroundColor: '#ff9800', color: '#fff', border: 'none', borderRadius: '4px' }}>
                Mark Payment: {order.payment_status === 'done' ? '✅' : '❌'}
              </button>
              {/*<button onClick={() => deleteOrder(order.id)} style={{ flex: 1, padding: '0.5rem', backgroundColor: '#f44336', color: '#fff', border: 'none', borderRadius: '4px' }}>Delete</button>*/}
              <button onClick={() => toggleOrderStatus(order)} style={{ flex: 1, padding: '0.5rem', backgroundColor: '#3f51b5', color: '#fff', border: 'none', borderRadius: '4px' }}>
                {order.status === 'received' ? 'Mark Completed' : 'Mark Received'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button onClick={() => setPage(prev => Math.max(prev - 1, 0))} disabled={page === 0} style={{ padding: '0.5rem 1rem', marginRight: '1rem' }}>Previous</button>
        <span><strong>Page {page + 1}</strong></span>
        <button onClick={() => setPage(prev => (prev + 1) * pageSize < filteredOrders.length ? prev + 1 : prev)} disabled={(page + 1) * pageSize >= filteredOrders.length} style={{ padding: '0.5rem 1rem', marginLeft: '1rem' }}>Next</button>
      </div>
    </div>
  );
}
