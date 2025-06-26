import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend,
  XAxis, YAxis, ResponsiveContainer
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50'];
const PAYMENT_COLORS = {
  Paid: '#4caf50',
  Pending: '#ffc107',
  Failed: '#f44336',
  Unknown: '#9e9e9e'
};
const ORDER_COLORS = {
  Completed: '#4caf50',
  Preparing: '#2196f3',
  Cancelled: '#f44336',
  'In Transit': '#ff9800',
  Unknown: '#9e9e9e'
};

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase.from('orders').select('*');
      if (!error) setOrders(data);
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = [...orders];
    if (statusFilter) filtered = filtered.filter(o => o.status === statusFilter);
    if (startDate) filtered = filtered.filter(o => new Date(o.timestamp) >= new Date(startDate));
    if (endDate) filtered = filtered.filter(o => new Date(o.timestamp) <= new Date(endDate));
    setFilteredOrders(filtered);
  }, [orders, statusFilter, startDate, endDate]);

  const revenueData = generateRevenueData(filteredOrders);
  const topItems = getTopItems(filteredOrders);
  const vegNonVeg = getVegVsNonVeg(filteredOrders);
  const dineDelivery = getDineVsDelivery(filteredOrders);
  const paymentStatus = getStatusCounts(filteredOrders, 'payment_status');
  const orderStatus = getStatusCounts(filteredOrders, 'status');
  const paymentStatusByMonth = getStackedStatusData(filteredOrders, 'payment_status');
  const orderStatusByMonth = getStackedStatusData(filteredOrders, 'status');

  const chartPairs = [
    [
      { title: '📈 Monthly Revenue', component: (<BarChart data={revenueData.month}><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="revenue" fill="#8884d8" /></BarChart>) },
      { title: '🔥 Top Selling Items', component: (<BarChart data={topItems} layout="vertical"><XAxis type="number" /><YAxis dataKey="name" type="category" /><Tooltip /><Bar dataKey="count" fill="#82ca9d" /></BarChart>) },
    ],
    [
      { title: '🌱 Veg vs Non-Veg Orders', component: (<PieChart><Pie data={vegNonVeg} dataKey="value" nameKey="type" cx="50%" cy="50%" outerRadius={80}>{vegNonVeg.map((entry, index) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart>) },
      { title: '🍽 Dine-in vs Delivery (Count)', component: (<PieChart><Pie data={dineDelivery.counts} dataKey="value" nameKey="type" cx="50%" cy="50%" outerRadius={80}>{dineDelivery.counts.map((entry, index) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart>) },
    ],
    [
      { title: '💰 Dine-in vs Delivery (Revenue)', component: (<PieChart><Pie data={dineDelivery.revenue} dataKey="value" nameKey="type" cx="50%" cy="50%" outerRadius={80}>{dineDelivery.revenue.map((entry, index) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart>) },
      { title: '💳 Payment Status (Donut)', component: (<PieChart><Pie data={paymentStatus} dataKey="value" nameKey="status" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>{paymentStatus.map((entry, index) => (<Cell key={index} fill={PAYMENT_COLORS[entry.status] || COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart>) },
    ],
    [
      { title: '📦 Order Status (Donut)', component: (<PieChart><Pie data={orderStatus} dataKey="value" nameKey="status" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>{orderStatus.map((entry, index) => (<Cell key={index} fill={ORDER_COLORS[entry.status] || COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart>) },
      { title: '📊 Payment Status Over Time', component: (<BarChart data={paymentStatusByMonth} stackOffset="expand"><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />{Object.keys(PAYMENT_COLORS).map(status => (<Bar key={status} dataKey={status} stackId="a" fill={PAYMENT_COLORS[status]} />))}</BarChart>) },
    ],
    [
      { title: '📦 Order Status Over Time', component: (<BarChart data={orderStatusByMonth} stackOffset="expand"><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />{Object.keys(ORDER_COLORS).map(status => (<Bar key={status} dataKey={status} stackId="a" fill={ORDER_COLORS[status]} />))}</BarChart>) }
    ]
  ];

  return (
    <div style={{ padding: '1rem' }}>
      <h2>📊 Dashboard</h2>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div>
          <label>Status: </label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="Completed">Completed</option>
            <option value="Preparing">Preparing</option>
            <option value="Cancelled">Cancelled</option>
            <option value="In Transit">In Transit</option>
          </select>
        </div>
        <div>
          <label>From: </label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label>To: </label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>
      {chartPairs.map((pair, idx) => (
        <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '2rem', marginBottom: '2rem' }}>
          {pair.map((chart, i) => (
            <ChartCard key={i} title={chart.title}>
              <ChartWrapper>{chart.component}</ChartWrapper>
            </ChartCard>
          ))}
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{ flex: '1 1 48%', minWidth: '300px', background: '#fff', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function ChartWrapper({ children }) {
  return (
    <div style={{ height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function generateRevenueData(orders) {
  const byMonth = {};
  orders.forEach(order => {
    const date = new Date(order.timestamp);
    const label = `${date.getMonth() + 1}/${date.getFullYear()}`;
    const total = order.items.reduce((sum, item) => sum + Number(item.price || 0), 0);
    byMonth[label] = (byMonth[label] || 0) + total;
  });
  return {
    month: Object.entries(byMonth).map(([label, revenue]) => ({ label, revenue }))
  };
}

function getTopItems(orders) {
  const itemCount = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      itemCount[item.name] = (itemCount[item.name] || 0) + 1;
    });
  });
  return Object.entries(itemCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getVegVsNonVeg(orders) {
  let veg = 0, nonveg = 0;
  orders.forEach(order => {
    order.items.forEach(item => {
      item.veg ? veg++ : nonveg++;
    });
  });
  return [
    { type: 'Veg', value: veg },
    { type: 'Non-Veg', value: nonveg }
  ];
}

function getDineVsDelivery(orders) {
  let dineCount = 0, deliveryCount = 0;
  let dineRevenue = 0, deliveryRevenue = 0;
  orders.forEach(order => {
    const total = order.items.reduce((sum, item) => sum + Number(item.price || 0), 0);
    if (order.type === 'dine-in') {
      dineCount++;
      dineRevenue += total;
    } else {
      deliveryCount++;
      deliveryRevenue += total;
    }
  });
  return {
    counts: [
      { type: 'Dine-in', value: dineCount },
      { type: 'Delivery', value: deliveryCount }
    ],
    revenue: [
      { type: 'Dine-in', value: dineRevenue },
      { type: 'Delivery', value: deliveryRevenue }
    ]
  };
}

function getStatusCounts(orders, key) {
  const statusMap = {};
  orders.forEach(order => {
    const status = order[key] || 'Unknown';
    statusMap[status] = (statusMap[status] || 0) + 1;
  });
  return Object.entries(statusMap).map(([status, value]) => ({ status, value }));
}

function getStackedStatusData(orders, key) {
  const map = {};
  orders.forEach(order => {
    const date = new Date(order.timestamp);
    const month = `${date.getMonth() + 1}/${date.getFullYear()}`;
    const status = order[key] || 'Unknown';
    if (!map[month]) map[month] = {};
    map[month][status] = (map[month][status] || 0) + 1;
  });
  return Object.entries(map).map(([month, statuses]) => ({ month, ...statuses }));
}
