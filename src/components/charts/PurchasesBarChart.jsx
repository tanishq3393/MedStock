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

export const PurchasesBarChart = ({ data }) => {
  const chartData = data || [
    { month: 'Mar', amount: 320000, units: 140 },
    { month: 'Apr', amount: 410000, units: 185 },
    { month: 'May', amount: 380000, units: 160 },
    { month: 'Jun', amount: 490000, units: 210 },
    { month: 'Jul', amount: 440000, units: 195 },
    { month: 'Aug', amount: 462500, units: 205 },
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
              name === 'amount' ? 'Purchase Spend' : 'Units Procured'
            ]}
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar 
            dataKey="amount" 
            name="Purchase Spend (₹)" 
            fill="#0A6E79" 
            radius={[6, 6, 0, 0]} 
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PurchasesBarChart;
