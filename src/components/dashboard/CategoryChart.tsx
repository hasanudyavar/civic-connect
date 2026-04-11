'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CategoryStat } from '@/lib/types';

interface CategoryChartProps {
  data: CategoryStat[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const chartData = data.map(d => ({
    name: d.category_name || d.category_slug,
    count: d.count,
    color: d.color || '#6B7280',
  }));

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        Complaints by Category
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'rgba(240,244,248,0.4)' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 11, fill: 'rgba(240,244,248,0.4)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 31, 61, 0.95)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px',
                fontSize: '13px',
                color: '#F0F4F8',
                fontFamily: "var(--font-body)",
                backdropFilter: 'blur(20px)',
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
