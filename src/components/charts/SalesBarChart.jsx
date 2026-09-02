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
    { month: 'Mar', amount: 480000, units: 220 },
    { month: 'Apr', amount: 530000, units: 245 },
    { month: 'May', amount: 590000, units: 280 },
    { month: 'Jun', amount: 620000, units: 290 },
    { month: 'Jul', amount: 645000, units: 310 },
    { month: 'Aug', amount: 689000, units: 340 },
  ];

  const formatCurrency = (val) => `₹${(val / 1000).toFixed(0)}k`;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            formatter={(value, name) => [
              name === 'amount' ? `₹${value.toLocaleString()}` : `${value} Units`, 
              name === 'amount' ? 'Gross Sales' : 'Units Sold'
            ]}
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar 
            dataKey="amount" 
            name="Gross Sales (₹)" 
            fill="#1A3A4A" 
            radius={[6, 6, 0, 0]} 
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesBarChart;
