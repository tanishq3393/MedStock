import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const SalesBarChart = ({ data }) => {
  const chartData = data || [
    { month: 'Mar', amount: 480000, units: 190 },
    { month: 'Apr', amount: 530000, units: 220 },
    { month: 'May', amount: 590000, units: 250 },
    { month: 'Jun', amount: 620000, units: 280 },
    { month: 'Jul', amount: 645000, units: 310 },
    { month: 'Aug', amount: 689000, units: 340 },
  ];

  const formatCurrency = (val) => `₹${(val / 1000).toFixed(0)}k`;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 12, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="salesBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} 
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            formatter={(value, name) => [
              name === 'amount' ? `₹${value.toLocaleString()}` : `${value} Units`, 
              name === 'amount' ? 'Redistribution Sales' : 'Units Transferred'
            ]}
            contentStyle={{ 
              backgroundColor: '#0F172A', 
              borderRadius: '12px', 
              border: '1px solid #334155', 
              color: '#F8FAFC',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}
            itemStyle={{ color: '#34D399' }}
            labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontWeight: 600 }} 
          />
          <Bar 
            dataKey="amount" 
            name="Redistribution Revenue (₹)" 
            fill="url(#salesBarGrad)" 
            radius={[6, 6, 0, 0]} 
            maxBarSize={38}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesBarChart;
