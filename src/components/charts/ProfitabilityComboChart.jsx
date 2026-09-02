import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const ProfitabilityComboChart = ({ data }) => {
  const chartData = data || [
    { month: 'Apr', revenue: 530000, cost: 410000, marginPercent: 22.6 },
    { month: 'May', revenue: 590000, cost: 380000, marginPercent: 35.5 },
    { month: 'Jun', revenue: 620000, cost: 490000, marginPercent: 20.9 },
    { month: 'Jul', revenue: 645000, cost: 440000, marginPercent: 31.7 },
    { month: 'Aug', revenue: 689000, cost: 462500, marginPercent: 32.8 },
  ];

  const formatCurrency = (val) => `₹${(val / 1000).toFixed(0)}k`;
  const formatPercent = (val) => `${val}%`;

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 15, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          {/* Left Y Axis for Amounts */}
          <YAxis 
            yAxisId="left"
            tickFormatter={formatCurrency}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          {/* Right Y Axis for Margin % */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            tickFormatter={formatPercent}
            tick={{ fill: '#f59e0b', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 50]}
          />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'marginPercent') return [`${value}%`, 'Profit Margin'];
              return [`₹${value.toLocaleString()}`, name === 'revenue' ? 'Sales Revenue' : 'Procurement Cost'];
            }}
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          
          <Bar 
            yAxisId="left" 
            dataKey="revenue" 
            name="Sales Revenue" 
            fill="#0A6E79" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={30}
          />
          <Bar 
            yAxisId="left" 
            dataKey="cost" 
            name="Procurement Cost" 
            fill="#94A3B8" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={30}
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="marginPercent" 
            name="Margin %" 
            stroke="#F59E0B" 
            strokeWidth={3}
            dot={{ r: 5, fill: '#F59E0B', strokeWidth: 2, stroke: '#FFFFFF' }}
            activeDot={{ r: 7 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProfitabilityComboChart;
