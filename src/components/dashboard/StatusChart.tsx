'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { StatusStat, ComplaintStatus } from '@/lib/types';
import { STATUS_CONFIG } from '@/lib/constants';

interface StatusChartProps {
  data: StatusStat[];
}

const PIE_COLORS: Record<string, string> = {
  NEW: '#3B82F6',
  ASSIGNED: '#8B5CF6',
  IN_PROGRESS: '#F59E0B',
  RESOLVED: '#22C55E',
  ESCALATED: '#EF4444',
  REOPENED: '#F97316',
  CLOSED: '#6B7280',
};

export function StatusChart({ data }: StatusChartProps) {
  const chartData = data.map(d => ({
    name: STATUS_CONFIG[d.status as ComplaintStatus]?.label || d.status,
    value: d.count,
    color: PIE_COLORS[d.status] || '#6B7280',
  }));

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-[var(--on-surface)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        Complaints by Status
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
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
            <Legend
              wrapperStyle={{ fontSize: '12px', fontFamily: "var(--font-body)", color: 'rgba(240,244,248,0.6)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
